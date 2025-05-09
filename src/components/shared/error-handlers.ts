import { toast } from 'sonner';

interface NetworkErrorHandlerOptions {
  showToast?: boolean;
  retryCallback?: () => void;
}

/**
 * Handle network errors in a consistent way
 * @param error The error object
 * @param options Options for handling the error
 */
export const handleNetworkError = (
  error: any,
  options: NetworkErrorHandlerOptions = { showToast: true }
) => {
  console.error('Network Error:', error);

  // Only show toast if option is enabled
  if (options.showToast) {
    toast.error('Connection Error', {
      description: 'Could not connect to the server. Please check your internet connection.',
      action: options.retryCallback
        ? {
            label: 'Retry',
            onClick: options.retryCallback,
          }
        : undefined,
    });
  }

  // Log additional details for debugging
  if (error.config) {
    console.log('Failed request details:', {
      url: error.config.url,
      method: error.config.method,
      headers: error.config.headers,
    });
  }

  // Return a standardized error object
  return {
    success: false,
    error: 'network_error',
    message: 'Could not connect to the server',
  };
};

/**
 * Handle API errors in a consistent way
 * @param error The error object from an API request
 */
export const handleApiError = (error: any) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const status = error.response.status;
    const data = error.response.data;

    console.error(`API Error (${status}):`, data);

    // Handle specific status codes
    switch (status) {
      case 401:
        toast.error('Authentication Error', {
          description: 'Your session has expired. Please log in again.',
        });
        break;
      case 403:
        toast.error('Access Denied', {
          description: 'You do not have permission to perform this action.',
        });
        break;
      case 404:
        toast.error('Not Found', {
          description: 'The requested resource was not found.',
        });
        break;
      case 422:
        toast.error('Validation Error', {
          description: data.message || 'Please check your input and try again.',
        });
        break;
      case 500:
        toast.error('Server Error', {
          description: 'Something went wrong on our end. Please try again later.',
        });
        break;
      default:
        toast.error('Error', {
          description: data.message || 'An unexpected error occurred.',
        });
    }

    return {
      success: false,
      error: `api_error_${status}`,
      message: data.message || 'API request failed',
      data: data,
    };
  } else if (error.request) {
    // The request was made but no response was received
    return handleNetworkError(error, { showToast: true });
  } else {
    // Something happened in setting up the request
    console.error('Request Setup Error:', error.message);
    toast.error('Request Error', {
      description: 'There was a problem with your request. Please try again.',
    });

    return {
      success: false,
      error: 'request_setup_error',
      message: error.message || 'Request setup failed',
    };
  }
};
