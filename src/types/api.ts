/**
 * API validation error
 */
export interface ValidationError {
  path: string;
  message: string;
}

/**
 * API response type
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: any;
  errors?: ValidationError[];
}
