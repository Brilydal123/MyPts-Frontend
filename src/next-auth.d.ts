// src/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser, User as NextAuthUserType } from "next-auth";
import { JWT as NextAuthJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session extends DefaultSession {
    accessToken?: string; // Store the accessToken on the session for client-side API calls if needed
    profileId?: string; // Optional, if you decide to expose it
    profileToken?: string; // Optional, if you decide to expose it
    error?: string; // For communicating token refresh errors to the client
    user: {
      id: string; // Ensure id is part of user in session
      isAdmin: boolean;
      role?: string;
      hasMultipleProfiles?: boolean;
      // You can add other properties from AppUser/ExtendedJWT that you want available in session.user
    } & DefaultSession["user"]; // Merge with default user properties like name, email, image
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   * Also, the shape of the user object returned by the `authorize` callback of the Credentials provider.
   */
  interface User extends NextAuthUserType { // Extends the default NextAuthUserType
    // Properties from your AppUser interface (must match what authorize returns)
    id: string;
    isAdmin: boolean;
    role?: string;
    token: string; // This is the accessToken from your backend
    refreshToken: string; // This is the refreshToken from your backend
    accessTokenExpires?: number;
    profileId: string; 
    profileToken: string; 
    hasMultipleProfiles?: boolean;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends NextAuthJWT {
    // Properties from your ExtendedJWT interface (must match what jwt callback returns)
    id: string; 
    isAdmin: boolean; 
    role?: string;
    accessToken: string; 
    accessTokenExpires?: number; 
    refreshToken: string;       
    profileId: string; 
    profileToken: string; 
    hasMultipleProfiles?: boolean;
    error?: string; // For handling refresh errors internally in the JWT callback
  }
}
