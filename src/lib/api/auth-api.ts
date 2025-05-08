import { ApiResponse } from "@/types/api";
import { API_BASE_URL } from "@/lib/config";

// Constants for API requests
const REQUEST_TIMEOUT = 15000; // 15 seconds

/**
 * Auth API service for registration and authentication
 */
export class AuthApi {
  /**
   * Generate username suggestions based on a full name
   */
  async generateUsernames(fullName: string): Promise<
    ApiResponse<{
      usernames: string[];
    }>
  > {
    try {
      console.log("Generating username suggestions for:", fullName);

      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      // The exact endpoint from Postman: {{myprofile_local_url}}/api/users/generate-username
      const url = `${API_BASE_URL}/users/generate-username`;
      const requestBody = { firstname: fullName };
      console.log(
        "Calling username suggestions API:",
        url,
        "with body:",
        requestBody
      );

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      const data = await response.json();
      console.log("Username suggestions response:", data);

      if (response.ok && data.success) {
        return {
          success: true,
          data: {
            usernames: data.usernames || [],
          },
        };
      }

      return {
        success: false,
        message: data.message || "Failed to generate username suggestions",
      };
    } catch (error) {
      console.error("Error generating username suggestions:", error);

      // Check if it's an abort error (timeout)
      if (error instanceof DOMException && error.name === "AbortError") {
        return {
          success: false,
          message: "Request timed out. Please try again.",
        };
      }

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate username suggestions",
      };
    }
  }

  /**
   * Check if a username is already taken
   */
  async checkUsername(username: string): Promise<
    ApiResponse<{
      exists: boolean;
      message: string;
    }>
  > {
    try {
      console.log("Checking if username exists:", username);

      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      // Use the correct endpoint for checking username availability
      const response = await fetch(
        `${API_BASE_URL}/auth/check-username/${encodeURIComponent(username)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      // Clear the timeout
      clearTimeout(timeoutId);

      const data = await response.json();
      console.log("Username check response:", data);

      return {
        success: true,
        data: {
          exists: !data.available, // Backend returns 'available: true/false'
          message:
            data.message ||
            (!data.available ? "Username already taken" : "Username available"),
        },
      };
    } catch (error) {
      console.error("Error checking username:", error);

      // Check if it's an abort error (timeout)
      if (error instanceof DOMException && error.name === "AbortError") {
        return {
          success: false,
          message: "Request timed out. Please try again.",
        };
      }

      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to check username",
      };
    }
  }
  /**
   * Register a new user
   */
  async register(userData: {
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
    referralCode?: string; // Add referral code parameter
  }): Promise<
    ApiResponse<{
      userId: string;
      verificationMethod: string;
      otpRequired: boolean;
      otpChannel: string;
    }>
  > {
    try {
      console.log("Registering user:", { ...userData, password: "******" });

      // Format date of birth as ISO string (YYYY-MM-DD)
      const formattedData = {
        ...userData,
        dateOfBirth: userData.dateOfBirth.toISOString().split("T")[0],
      };

      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
        signal: controller.signal,
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      const data = await response.json();

      console.log("Registration response:", data);

      if (response.ok && data.success) {
        return {
          success: true,
          data: {
            userId: data.userId,
            verificationMethod: data.verificationMethod,
            otpRequired: data.otpRequired,
            otpChannel: data.otpChannel,
          },
          message: data.message,
        };
      }

      return {
        success: false,
        message: data.message || "Registration failed",
      };
    } catch (error) {
      console.error("Error in registration:", error);

      // Check if it's an abort error (timeout)
      if (error instanceof DOMException && error.name === "AbortError") {
        return {
          success: false,
          message: "Request timed out. Please try again.",
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : "Registration failed",
      };
    }
  }

  /**
   * Verify OTP for registration
   */
  async verifyOTP(
    userId: string,
    otp: string,
    verificationMethod: "email" | "phone"
  ): Promise<
    ApiResponse<{
      success: boolean;
      message: string;
      user?: any;
    }>
  > {
    try {
      console.log("Verifying OTP:", { userId, otp, verificationMethod });

      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: userId, // Backend expects _id, not userId
          otp,
          verificationMethod,
        }),
        signal: controller.signal,
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      const data = await response.json();

      console.log("OTP verification response:", data);

      if (response.ok && data.success) {
        return {
          success: true,
          data: {
            success: true,
            message: data.message,
            user: data.user,
          },
          message: data.message,
        };
      }

      return {
        success: false,
        message: data.message || "OTP verification failed",
      };
    } catch (error) {
      console.error("Error in OTP verification:", error);

      // Check if it's an abort error (timeout)
      if (error instanceof DOMException && error.name === "AbortError") {
        return {
          success: false,
          message: "Request timed out. Please try again.",
        };
      }

      return {
        success: false,
        message:
          error instanceof Error ? error.message : "OTP verification failed",
      };
    }
  }

  /**
   * Check if an email is already registered
   */
  async checkEmail(email: string): Promise<
    ApiResponse<{
      exists: boolean;
      message: string;
    }>
  > {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      console.log(API_BASE_URL);

      const response = await fetch(
        `${API_BASE_URL}/auth/check-email/${encodeURIComponent(email)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      console.log("Email check response:", response);

      // Clear the timeout
      clearTimeout(timeoutId);

      const data = await response.json();

      console.log("Email check response:", data);

      return {
        success: true,
        data: {
          exists: !data.available, // Backend returns 'available: true/false'
          message:
            data.message ||
            (!data.available ? "Email already registered" : "Email available"),
        },
      };
    } catch (error) {
      console.error("Error checking email:", error);

      // Check if it's an abort error (timeout)
      if (error instanceof DOMException && error.name === "AbortError") {
        return {
          success: false,
          message: "Request timed out. Please try again.",
        };
      }

      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to check email",
      };
    }
  }

  /**
   * Resend OTP for verification
   */
  async resendOTP(
    userId: string,
    verificationMethod: "EMAIL" | "PHONE"
  ): Promise<
    ApiResponse<{
      success: boolean;
      message: string;
      otp?: string; // For development only
    }>
  > {
    try {
      console.log("Resending OTP:", { userId, verificationMethod });

      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: userId, // Backend expects _id, not userId
          verificationMethod,
        }),
        signal: controller.signal,
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      const data = await response.json();

      console.log("Resend OTP response:", data);

      if (response.ok && data.success) {
        return {
          success: true,
          data: {
            success: true,
            message: data.message,
            otp: data.otp, // For development only
          },
          message: data.message,
        };
      }

      return {
        success: false,
        message: data.message || "Failed to resend OTP",
      };
    } catch (error) {
      console.error("Error in resending OTP:", error);

      // Check if it's an abort error (timeout)
      if (error instanceof DOMException && error.name === "AbortError") {
        return {
          success: false,
          message: "Request timed out. Please try again.",
        };
      }

      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to resend OTP",
      };
    }
  }

  /**
   * Handle trouble logging in requests
   */
  async troubleLogin(data: {
    identifier: string;
    issue: string;
    verificationMethod?: "EMAIL" | "PHONE";
  }): Promise<
    ApiResponse<{
      success: boolean;
      message: string;
      nextSteps?: string[];
      otpSent?: boolean;
    }>
  > {
    try {
      console.log("Submitting trouble login request:", data);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(`${API_BASE_URL}/auth/trouble-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json();
      console.log("Trouble login response:", responseData);

      if (response.ok && responseData.success) {
        return {
          success: true,
          data: {
            success: true,
            message: responseData.message,
            nextSteps: responseData.nextSteps || [],
            otpSent: responseData.otpSent || false,
          },
          message: responseData.message,
        };
      }

      return {
        success: false,
        message: responseData.message || "Failed to process trouble login request",
      };
    } catch (error) {
      console.error("Error submitting trouble login request:", error);

      if (error instanceof DOMException && error.name === "AbortError") {
        return {
          success: false,
          message: "Request timed out. Please try again.",
        };
      }

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to process trouble login request",
      };
    }
  }

  /**
   * Update user profile information
   */
  async updateProfile(data: {
    dateOfBirth?: string;
    countryOfResidence?: string;
  }): Promise<ApiResponse<any>> {
    try {
      console.log("Updating user profile:", data);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      // Get access token from localStorage
      let accessToken = null;
      if (typeof window !== 'undefined') {
        accessToken = localStorage.getItem('accessToken');
      }

      // Prepare headers with token if available
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        headers['x-token-verified'] = 'true';
        headers['x-access-token'] = accessToken;
      }

      console.log('Update profile request headers:', headers);

      const response = await fetch('/api/auth/update-profile', {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json();
      console.log("Update profile response:", responseData);

      if (response.ok && responseData.success) {
        return {
          success: true,
          data: responseData.data,
          message: responseData.message,
        };
      }

      return {
        success: false,
        message: responseData.message || "Failed to update profile",
      };
    } catch (error) {
      console.error("Error updating profile:", error);

      if (error instanceof DOMException && error.name === "AbortError") {
        return {
          success: false,
          message: "Request timed out. Please try again.",
        };
      }

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update profile",
      };
    }
  }
}

// Export instance
export const authApi = new AuthApi();
