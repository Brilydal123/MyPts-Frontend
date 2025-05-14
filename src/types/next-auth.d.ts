import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      isAdmin?: boolean;
      role?: string;
      hasMultipleProfiles?: boolean;
    } & DefaultSession["user"];
    accessToken?: string;
    refreshToken?: string;
    profileId?: string;
    profileToken?: string;
    error?: string;
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User extends DefaultUser {
    id: string;
    isAdmin?: boolean;
    role?: string;
    token?: string;
    refreshToken?: string;
    profileId?: string;
    profileToken?: string;
    hasMultipleProfiles?: boolean;
    accessTokenExpires?: number;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id: string;
    isAdmin?: boolean;
    role?: string;
    accessToken?: string;
    refreshToken?: string;
    profileId?: string;
    profileToken?: string;
    hasMultipleProfiles?: boolean;
    accessTokenExpires?: number;
    error?: string;
  }
}
