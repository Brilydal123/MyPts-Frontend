/**
 * API base URL
 * In development, this should point to your local API server
 * In production, this should point to your deployed API server
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Frontend base URL
 * Used for callbacks and redirects
 */
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || (typeof window !== 'undefined' ? window.location.origin : '');

/**
 * Default profile image URL
 */
export const DEFAULT_PROFILE_IMAGE = '/images/profileblack.png';

/**
 * JWT token storage key
 */
export const TOKEN_STORAGE_KEY = 'accessToken';

/**
 * Selected profile ID storage key
 */
export const PROFILE_ID_STORAGE_KEY = 'selectedProfileId';
