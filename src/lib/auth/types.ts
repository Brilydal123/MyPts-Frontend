/**
 * Authentication Types
 * 
 * This file contains type definitions for the authentication system.
 */

/**
 * User interface
 */
export interface User {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  isAdmin?: boolean;
  profileId?: string;
  hasMultipleProfiles?: boolean;
  image?: string;
}

/**
 * Extended JWT interface for NextAuth
 */
export interface ExtendedJWT {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  isAdmin?: boolean;
  profileId?: string;
  profileToken?: string;
  hasMultipleProfiles?: boolean;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  error?: string;
}

/**
 * Auth State interface for the Auth Context
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  user: User | null;
  error: string | null;
}

/**
 * Auth Context interface
 */
export interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
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
 * API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Session interface
 */
export interface Session {
  user: User;
  accessToken?: string;
  profileId?: string;
  profileToken?: string;
  error?: string;
  expires: string;
}

/**
 * Profile interface
 */
export interface Profile {
  id: string;
  name: string;
  type: string;
  userId: string;
  balance?: number;
}

/**
 * Social auth provider
 */
export type SocialProvider = 'google';
