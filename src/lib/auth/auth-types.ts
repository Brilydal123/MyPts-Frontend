/**
 * Authentication Types
 * 
 * This file contains TypeScript types for the authentication system.
 */

import { User as NextAuthUser, Session as NextAuthSession } from "next-auth";
import { JWT } from "next-auth/jwt";

/**
 * Application User type extending NextAuth's User
 */
export interface AppUser extends NextAuthUser {
  id: string;
  isAdmin: boolean;
  role?: string;
  token: string; // Access token
  refreshToken: string;
  accessTokenExpires?: number;
  profileId: string;
  profileToken: string;
  hasMultipleProfiles?: boolean;
}

/**
 * Extended JWT type for NextAuth
 */
export interface ExtendedJWT extends JWT {
  id: string;
  isAdmin: boolean;
  role?: string;
  accessToken: string;
  accessTokenExpires?: number;
  refreshToken: string;
  profileId: string;
  profileToken: string;
  hasMultipleProfiles?: boolean;
  error?: string;
}

/**
 * Extended Session type for NextAuth
 */
export interface ExtendedSession extends NextAuthSession {
  accessToken?: string;
  profileId?: string;
  profileToken?: string;
  error?: string;
  user: {
    id: string;
    isAdmin: boolean;
    role?: string;
    hasMultipleProfiles?: boolean;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

/**
 * Auth State interface for the Auth Context
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  user: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    isAdmin?: boolean;
    profileId?: string;
    hasMultipleProfiles?: boolean;
  } | null;
  error: string | null;
}

/**
 * Auth Context interface
 */
export interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: Partial<AuthState['user']>) => void;
}

/**
 * Login credentials interface
 */
export interface LoginCredentials {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Registration data interface
 */
export interface RegistrationData {
  email: string;
  password: string;
  fullName: string;
  username: string;
  accountType: "MYSELF" | "SOMEONE_ELSE";
  dateOfBirth: Date;
  phoneNumber: string;
  countryOfResidence: string;
  verificationMethod: "EMAIL" | "PHONE";
  accountCategory: "PRIMARY_ACCOUNT" | "SECONDARY_ACCOUNT";
  referralCode?: string;
}

/**
 * Token response interface
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  profileId?: string;
  profileToken?: string;
  expiresIn?: number;
}

/**
 * Auth error types
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TOKEN_ERROR = 'TOKEN_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
