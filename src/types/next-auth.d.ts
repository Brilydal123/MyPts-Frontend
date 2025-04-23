import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      role?: string; // Add role property
      hasMultipleProfiles?: boolean; // Add flag for multiple profiles
    } & DefaultSession["user"];
    accessToken: string;
    profileId: string;
    profileToken: string;
  }

  interface User extends DefaultUser {
    isAdmin: boolean;
    role?: string; // Add role property
    token: string;
    profileId: string;
    profileToken: string;
    hasMultipleProfiles?: boolean; // Add flag for multiple profiles
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isAdmin: boolean;
    role?: string; // Add role property
    accessToken: string;
    profileId: string;
    profileToken: string;
    hasMultipleProfiles?: boolean; // Add flag for multiple profiles
  }
}
