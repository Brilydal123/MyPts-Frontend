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
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: any;
  errors?: ValidationError[];
}

/**
 * Auth API types
 */
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  username: string;
  accountType: 'MYSELF' | 'SOMEONE_ELSE';
  dateOfBirth: Date;
  phoneNumber: string;
  countryOfResidence: string;
  verificationMethod: 'EMAIL' | 'PHONE';
  accountCategory: 'PRIMARY_ACCOUNT' | 'SECONDARY_ACCOUNT';
}

export interface RegisterResponse {
  userId: string;
  verificationMethod: string;
  otpRequired: boolean;
  otpChannel: string;
}

export interface VerifyOTPRequest {
  userId: string;
  otp: string;
  verificationMethod: 'email' | 'phone';
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  user?: any;
}

export interface ResendOTPRequest {
  userId: string;
  verificationMethod: 'EMAIL' | 'PHONE';
}

export interface ResendOTPResponse {
  success: boolean;
  message: string;
}
