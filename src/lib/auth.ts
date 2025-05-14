import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import { AppUser, ExtendedJWT } from "./auth/auth-types";
import AUTH_CONFIG from "./auth/auth-config";

import { parseJwt } from './auth/token-service';
import { refreshAccessTokenServer } from './auth/token-service';

/**
 * Refresh access token for NextAuth
 * @param token Current JWT token
 * @returns Updated JWT token
 */
async function refreshAccessToken(token: ExtendedJWT): Promise<ExtendedJWT> {
  try {
    console.log("[NextAuth JWT Callback] Attempting to refresh access token.");

    // First try using the API endpoint
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: token.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.tokens) {
          console.log("Token refreshed successfully via API endpoint");

          const decodedAccessToken = parseJwt(data.tokens.accessToken);

          return {
            ...token,
            accessToken: data.tokens.accessToken,
            accessTokenExpires: decodedAccessToken?.exp ? decodedAccessToken.exp * 1000 : Date.now() + 3600000,
            refreshToken: data.tokens.refreshToken || token.refreshToken,
            profileId: data.tokens.profileId ?? token.profileId,
            profileToken: data.tokens.profileToken ?? token.profileToken,
            error: undefined,
          };
        }
      }
    } catch (apiError) {
      console.error("API refresh token error:", apiError);
      // Continue to fallback method
    }

    // Fallback: Call the token refresh function directly
    const refreshedTokens = await refreshAccessTokenServer(token.refreshToken);

    if (!refreshedTokens) {
      console.error("refreshAccessToken: Failed to refresh token");
      return {
        ...token,
        error: "RefreshAccessTokenError",
      };
    }

    const decodedAccessToken = parseJwt(refreshedTokens.accessToken);

    const tokenToReturn: ExtendedJWT = {
      ...token, // Preserve existing properties
      accessToken: refreshedTokens.accessToken,
      accessTokenExpires: decodedAccessToken?.exp ? decodedAccessToken.exp * 1000 : Date.now() + 3600000,
      refreshToken: refreshedTokens.refreshToken || token.refreshToken,
      profileId: refreshedTokens.profileId ?? token.profileId,
      profileToken: refreshedTokens.profileToken ?? token.profileToken,
      error: undefined, // Clear any previous error
    };

    console.log("refreshAccessToken: Token refreshed successfully via direct method");
    return tokenToReturn;
  } catch (error) {
    console.error("refreshAccessToken: Error:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "checkbox" }
      },
      async authorize(credentials): Promise<AppUser | null> {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        try {
          const apiUrl = AUTH_CONFIG.api.baseUrl;
          console.log('Auth API using URL:', apiUrl);

          const response = await fetch(`${apiUrl}${AUTH_CONFIG.api.endpoints.login}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              identifier: credentials.identifier,
              password: credentials.password,
              rememberMe: credentials.rememberMe === 'true',
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            console.error("Auth failed on backend:", data.message || "Unknown authentication error");
            throw new Error(data.message || "Authentication failed");
          }

          const accessToken = data.tokens?.accessToken;
          const refreshToken = data.tokens?.refreshToken;

          if (!accessToken) {
            console.error("Access Token not found in login response");
            return null;
          }

          const decodedAccessToken = parseJwt(accessToken);
          const userId = decodedAccessToken?.userId || data.user?._id || data.user?.id;
          const email = decodedAccessToken?.email || credentials.identifier;
          const accessTokenExpires = decodedAccessToken?.exp
            ? decodedAccessToken.exp * 1000
            : Date.now() + AUTH_CONFIG.tokens.accessToken.maxAge * 1000;

          // Get user details
          let userDetails = data.user || {};

          // If needed, fetch additional user data
          if (!userDetails.fullName || !userDetails.role) {
            console.log('Fetching additional user data...');
            const userResponse = await fetch(`${apiUrl}${AUTH_CONFIG.api.endpoints.me}`, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (userResponse.ok) {
              const userData = await userResponse.json();
              if (userData.success && userData.user) {
                userDetails = { ...userDetails, ...userData.user };
              }
            }
          }

          // Create the user object for NextAuth
          const user: AppUser = {
            id: userId,
            name: userDetails.fullName || email.split('@')[0],
            email: email,
            image: userDetails.profileImage || null,
            role: userDetails.role || 'user',
            isAdmin: userDetails.role === 'admin',
            token: accessToken,
            refreshToken: refreshToken,
            accessTokenExpires: accessTokenExpires,
            profileId: userDetails.profiles?.[0]?._id || '',
            profileToken: userDetails.profiles?.[0]?.accessToken || '',
            hasMultipleProfiles: (userDetails.profiles?.length || 0) > 1,
          };

          return user;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }): Promise<ExtendedJWT> {
      let extendedToken = token as ExtendedJWT;

      // Initial sign-in: user object is available
      if (account && user) {
        const appUser = user as AppUser;
        console.log("[NextAuth JWT Callback] Initial sign-in for user:", appUser.id);

        // Set token properties from user object
        extendedToken = {
          ...extendedToken,
          id: appUser.id,
          accessToken: appUser.token,
          refreshToken: appUser.refreshToken,
          accessTokenExpires: appUser.accessTokenExpires,
          role: appUser.role,
          isAdmin: appUser.isAdmin,
          profileId: appUser.profileId,
          profileToken: appUser.profileToken,
          hasMultipleProfiles: appUser.hasMultipleProfiles,
          error: undefined,
        };

        return extendedToken;
      }

      // Subsequent calls: check if token is still valid
      if (extendedToken.accessTokenExpires && Date.now() < extendedToken.accessTokenExpires) {
        return extendedToken;
      }

      // Token has expired, attempt to refresh it
      console.log("[NextAuth JWT Callback] Access token expired for user:", extendedToken.id);

      if (!extendedToken.refreshToken) {
        console.warn("[NextAuth JWT Callback] No refresh token available for user:", extendedToken.id);
        return { ...extendedToken, error: "NoRefreshToken" };
      }

      return refreshAccessToken(extendedToken);
    },

    async session({ session, token }) {
      const extendedToken = token as ExtendedJWT;

      // Add token properties to session
      session.user.id = extendedToken.id;
      session.user.role = extendedToken.role;
      session.user.isAdmin = extendedToken.isAdmin;
      session.accessToken = extendedToken.accessToken;
      session.profileId = extendedToken.profileId;
      session.profileToken = extendedToken.profileToken;
      (session.user as any).hasMultipleProfiles = extendedToken.hasMultipleProfiles;

      // Propagate error for client-side handling
      if (extendedToken.error) {
        session.error = extendedToken.error;
        console.log("[NextAuth Session Callback] Session error for user:", extendedToken.id, ":", extendedToken.error);
      }

      return session;
    },
  },
  pages: {
    signIn: AUTH_CONFIG.routes.login,
    signOut: AUTH_CONFIG.routes.login,
    error: AUTH_CONFIG.routes.authError,
  },
  session: {
    strategy: "jwt",
    maxAge: AUTH_CONFIG.session.maxAge,
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: AUTH_CONFIG.tokens.accessToken.sameSite,
        path: "/",
        secure: AUTH_CONFIG.tokens.accessToken.secure,
        maxAge: AUTH_CONFIG.session.maxAge
      }
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        sameSite: AUTH_CONFIG.tokens.accessToken.sameSite,
        path: "/",
        secure: AUTH_CONFIG.tokens.accessToken.secure,
        maxAge: AUTH_CONFIG.session.maxAge
      }
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: AUTH_CONFIG.tokens.accessToken.sameSite,
        path: "/",
        secure: AUTH_CONFIG.tokens.accessToken.secure,
        maxAge: AUTH_CONFIG.csrf.maxAge
      }
    }
  },
  secret: AUTH_CONFIG.nextAuth.secret,
  debug: process.env.NODE_ENV === 'development'
};
