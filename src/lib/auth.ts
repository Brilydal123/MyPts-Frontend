import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions, User as NextAuthUser } from "next-auth";
import { JWT } from "next-auth/jwt";

// Define a type for your application's user object that you return from authorize
interface AppUser extends NextAuthUser {
  id: string;
  isAdmin: boolean; 
  role?: string;
  token: string; // Made non-optional (represents accessToken)
  refreshToken: string; // Made non-optional
  accessTokenExpires?: number; // Store expiry time for accessToken
  profileId: string; // Made non-optional
  profileToken: string; // Made non-optional
  hasMultipleProfiles?: boolean;
  // Add any other custom properties
}

// Define the expected shape of the token object after your modifications
interface ExtendedJWT extends JWT {
  id: string; // Made non-optional
  isAdmin: boolean; 
  role?: string;
  accessToken: string; // Made non-optional
  accessTokenExpires?: number; // To store expiry time
  refreshToken: string;       // Made non-optional (This is the refresh token NextAuth holds)
  profileId: string; // Made non-optional
  profileToken: string; // Made non-optional
  hasMultipleProfiles?: boolean;
  error?: string; // To handle refresh errors
}

// Helper function to decode JWT (simplified, use a library like jwt-decode in practice)
// In a server environment (NextAuth.js callbacks), you might not need a full JWT library for 'exp'
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(Buffer.from(base64, 'base64').toString().split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse JWT token:", e);
    return null;
  }
}

async function refreshAccessToken(token: ExtendedJWT): Promise<ExtendedJWT> {
  try {
    console.log("[NextAuth JWT Callback] Attempting to refresh access token.");
    // Ensure NEXTAUTH_URL is set in your environment variables for deployment
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/frontend-refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // The /api/auth/frontend-refresh route reads the refreshToken from HttpOnly cookies
      // automatically sent by the browser. No need to send 'refreshToken' in the body here.
    });

    const refreshedTokens = await response.json();
    console.log("REFRESHED TOKENS from proxy:", refreshedTokens);

    if (!response.ok || !refreshedTokens.success || !refreshedTokens.tokens) {
      console.error("refreshAccessToken: Failed to refresh token from proxy", refreshedTokens);
      // It's important to return the token with an error, but ensure it still conforms to ExtendedJWT
      return {
        ...token,
        error: "RefreshAccessTokenError",
        // profileId and profileToken are already strings in 'token' due to ExtendedJWT type
      };
    }

    const decodedAccessToken = parseJwt(refreshedTokens.tokens.accessToken);

    const tokenToReturn: ExtendedJWT = {
      ...token, // Spread existing token to preserve other properties like id, isAdmin, role etc.
      accessToken: refreshedTokens.tokens.accessToken,
      accessTokenExpires: decodedAccessToken.exp * 1000,
      refreshToken: refreshedTokens.tokens.refreshToken || token.refreshToken, // Use new RT if provided, else old
      // Ensure profileId and profileToken are strings, using existing from token as fallback
      profileId: refreshedTokens.tokens.profileId ?? token.profileId, 
      profileToken: refreshedTokens.tokens.profileToken ?? token.profileToken,
      error: undefined, // Clear any previous error
    };

    console.log("refreshAccessToken: Token refreshed successfully, returning:", tokenToReturn);
    return tokenToReturn;
  } catch (error) {
    console.error("refreshAccessToken: Catch block error:", error);
    // Return token with error, ensuring it conforms to ExtendedJWT
    return {
      ...token,
      error: "RefreshAccessTokenError",
      // profileId and profileToken are already strings in 'token'
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<AppUser | null> {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
          console.log('Auth API using URL:', API_URL);
          const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              identifier: credentials.identifier,
              password: credentials.password,
            }),
            // credentials: 'include', // Generally not needed here if backend sets cookies for browser
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            console.error("Auth failed on backend:", data.message || "Unknown authentication error");
            throw new Error(data.message || "Authentication failed");
          }

          const accessToken = data.tokens?.accessToken;
          const refreshTokenFromLoginBody = data.tokens?.refreshToken; // From login response body

          if (!accessToken) {
            console.error("Access Token not found in login response body.");
            return null;
          }

          const decodedAccessToken: { exp: number, userId: string, email: string } | null = parseJwt(accessToken);
          const userIdFromToken = decodedAccessToken?.userId || data.user?._id || data.user?.id;
          const emailFromToken = decodedAccessToken?.email || credentials.identifier;
          const accessTokenExpires = decodedAccessToken?.exp ? decodedAccessToken.exp * 1000 : Date.now() + (1 * 60 * 60 * 1000);

          // Consolidate user data fetching if possible
          let userDetails = data.user || {}; // Start with user data from login response
          
          // If more details are needed and not present in login response, fetch /me
          // This is an example; adjust based on what /auth/login returns vs /users/me
          if (!userDetails.fullName || !userDetails.role) { 
            console.log('Fetching additional user data from /users/me...');
            const userMeResponse = await fetch(`${API_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (userMeResponse.ok) {
                const meData = await userMeResponse.json();
                if (meData.success && meData.user) {
                    userDetails = { ...userDetails, ...meData.user }; // Merge
                }
            } else {
                console.warn('Failed to fetch complete user data from /me:', await userMeResponse.text());
            }
          }

          const finalUser: AppUser = {
            id: userIdFromToken,
            name: userDetails.fullName || emailFromToken.split('@')[0],
            email: emailFromToken,
            image: userDetails.profileImage || null,
            role: userDetails.role || 'user',
            isAdmin: userDetails.role === 'admin',
            token: accessToken, 
            refreshToken: refreshTokenFromLoginBody, 
            accessTokenExpires: accessTokenExpires,
            profileId: userDetails.profiles?.[0]?._id,
            profileToken: userDetails.profiles?.[0]?.accessToken,
            hasMultipleProfiles: (userDetails.profiles?.length || 0) > 1,
          };

          console.log('===== AUTHORIZE RETURNING USER OBJECT =====');
          console.log(JSON.stringify(finalUser, null, 2));

          return finalUser;
        } catch (error: any) {
          console.error("Authentication error in authorize:", error.message);
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
        extendedToken.accessToken = appUser.token;
        extendedToken.refreshToken = appUser.refreshToken; // This is crucial for the refresh flow
        extendedToken.accessTokenExpires = appUser.accessTokenExpires;
        extendedToken.id = appUser.id;
        extendedToken.role = appUser.role;
        extendedToken.isAdmin = appUser.isAdmin;
        extendedToken.profileId = appUser.profileId;
        extendedToken.profileToken = appUser.profileToken;
        extendedToken.hasMultipleProfiles = appUser.hasMultipleProfiles;
        extendedToken.error = undefined; // Clear any previous error
        return extendedToken;
      }

      // Subsequent calls: token object is available, user is not.
      // Check if the access token is still valid.
      if (extendedToken.accessTokenExpires && Date.now() < extendedToken.accessTokenExpires) {
        // console.log("[NextAuth JWT Callback] Access token is still valid for user:", extendedToken.id);
        return extendedToken;
      }

      // Access token has expired or is not present. Attempt to refresh it.
      console.log("[NextAuth JWT Callback] Access token expired for user:", extendedToken.id, ". Attempting refresh.");
      if (!extendedToken.refreshToken) {
          console.warn("[NextAuth JWT Callback] No refresh token available for user:", extendedToken.id, ". Cannot refresh.");
          // This might mean re-authentication is needed or the initial login didn't provide RT to NextAuth.
          return { ...extendedToken, error: "NoRefreshToken" }; 
      }
      return refreshAccessToken(extendedToken);
    },
    async session({ session, token }) {
      const extendedToken = token as ExtendedJWT;
      // Send properties to the client, like an access_token and user id
      session.user.id = extendedToken.id as string;
      session.user.role = extendedToken.role as string;
      session.user.isAdmin = extendedToken.isAdmin as boolean;
      session.accessToken = extendedToken.accessToken as string;
      // It's generally advised NOT to expose refreshToken to the client-side session.
      // session.refreshToken = extendedToken.refreshToken as string; 
      session.profileId = extendedToken.profileId as string;
      session.profileToken = extendedToken.profileToken as string;
      (session.user as any).hasMultipleProfiles = extendedToken.hasMultipleProfiles as boolean;
      
      if (extendedToken.error) {
        session.error = extendedToken.error; // Propagate error for client-side handling
        console.log("[NextAuth Session Callback] Session error for user:", extendedToken.id, ":", extendedToken.error);
      }
      // console.log("[NextAuth Session Callback] Session populated for user:", session.user.id);
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login", // Redirect to login after sign out
    error: "/auth/error", // Error code passed in query string as ?error=
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days for the NextAuth session cookie itself
  },
  secret: process.env.NEXTAUTH_SECRET || "mysecret", // Ensure this is strong and in .env
  debug: process.env.NODE_ENV === 'development', // More logs in dev
};
