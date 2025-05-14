import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { ExtendedJWT } from "./types";
import AUTH_CONFIG from "./config";

/**
 * Refresh access token for NextAuth
 * @param token Current JWT token
 * @returns Updated JWT token
 */
async function refreshAccessToken(token: ExtendedJWT): Promise<ExtendedJWT> {
  try {
    console.log("[NextAuth] Refreshing access token");

    // Call the backend API to refresh the token
    const response = await fetch(`${AUTH_CONFIG.api.baseUrl}${AUTH_CONFIG.api.endpoints.refreshToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("[NextAuth] Failed to refresh token:", data.message || response.statusText);
      return {
        ...token,
        error: "RefreshAccessTokenError",
      };
    }

    console.log("[NextAuth] Token refreshed successfully");

    return {
      ...token,
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken || token.refreshToken,
      accessTokenExpires: Date.now() + (data.tokens.expiresIn || 3600) * 1000,
      error: undefined,
    };
  } catch (error) {
    console.error("[NextAuth] Error refreshing token:", error);
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
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        try {
          // Call the backend API to authenticate
          const response = await fetch(`${AUTH_CONFIG.api.baseUrl}${AUTH_CONFIG.api.endpoints.login}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              identifier: credentials.identifier,
              password: credentials.password,
              rememberMe: credentials.rememberMe === 'true',
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            console.error("[NextAuth] Login failed:", data.message || response.statusText);
            return null;
          }

          // Return the user object with tokens
          return {
            id: data.user.id,
            name: data.user.fullName,
            email: data.user.email,
            role: data.user.role,
            isAdmin: data.user.isAdmin,
            profileId: data.user.profileId,
            hasMultipleProfiles: data.user.hasMultipleProfiles,
            token: data.tokens.accessToken,
            refreshToken: data.tokens.refreshToken,
            profileToken: data.tokens.profileToken,
            accessTokenExpires: Date.now() + (data.tokens.expiresIn || 3600) * 1000,
          };
        } catch (error) {
          console.error("[NextAuth] Error during login:", error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: AUTH_CONFIG.social.google.clientId,
      clientSecret: AUTH_CONFIG.social.google.clientSecret,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign-in
      if (account && user) {
        console.log("[NextAuth] Initial sign-in for user:", user.id);

        // Store tokens in the JWT
        const newToken = {
          ...token,
          id: user.id,
          accessToken: (user as any).token || (user as any).accessToken,
          refreshToken: (user as any).refreshToken,
          accessTokenExpires: (user as any).accessTokenExpires,
          role: (user as any).role,
          isAdmin: (user as any).isAdmin,
          profileId: (user as any).profileId,
          profileToken: (user as any).profileToken,
          hasMultipleProfiles: (user as any).hasMultipleProfiles,
        };

        console.log("[NextAuth] Token created:", {
          hasAccessToken: !!newToken.accessToken,
          hasRefreshToken: !!newToken.refreshToken,
          hasProfileToken: !!newToken.profileToken,
          expiresAt: newToken.accessTokenExpires ? new Date(newToken.accessTokenExpires).toISOString() : 'unknown'
        });

        return newToken;
      }

      // Handle session update
      if (trigger === 'update' && session) {
        console.log("[NextAuth] Session update triggered");
        return { ...token, ...session.user };
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        // Token is still valid
        return token;
      }

      // Access token has expired, try to refresh it
      console.log("[NextAuth] Token expired, refreshing...");
      return refreshAccessToken(token as ExtendedJWT);
    },
    async session({ session, token }) {
      console.log("[NextAuth] Building session from token");

      // Add user information to the session
      session.user = {
        id: token.id as string,
        name: token.name,
        email: token.email,
        role: token.role as string | undefined,
        isAdmin: !!token.isAdmin, // Convert to boolean
        profileId: token.profileId as string | undefined,
        hasMultipleProfiles: !!token.hasMultipleProfiles, // Convert to boolean
        image: token.picture as string | undefined,
      } as typeof session.user & { profileId?: string | undefined };

      // Add tokens to the session
      session.accessToken = token.accessToken as string | undefined;
      session.profileId = token.profileId as string | undefined;
      session.profileToken = token.profileToken as string | undefined;
      session.error = (token as ExtendedJWT).error;

      console.log("[NextAuth] Session built:", {
        hasAccessToken: !!session.accessToken,
        hasProfileId: !!session.profileId,
        hasProfileToken: !!session.profileToken,
        hasError: !!session.error
      });

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
      name: AUTH_CONFIG.tokens.accessToken.cookieName,
      options: {
        httpOnly: true,
        sameSite: AUTH_CONFIG.tokens.accessToken.sameSite,
        path: "/",
        secure: AUTH_CONFIG.tokens.accessToken.secure,
        maxAge: AUTH_CONFIG.tokens.accessToken.maxAge,
      },
    },
  },
  debug: process.env.NODE_ENV === "development",
};

export default authOptions;
