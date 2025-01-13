import { toast } from "@/components/ui/use-toast"

interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
    status?: number;
  };
  message?: string;
}

export const handleError = (error: ErrorResponse, customMessage?: string) => {
  console.log('Error handler received:', {
    responseData: error.response?.data,
    responseStatus: error.response?.status,
    errorMessage: error.message,
    customMessage
  });
  
  // Get the most appropriate error message
  const errorMessage = error.response?.data?.message || 
                      error.response?.data?.error ||
                      error.message ||
                      customMessage ||
                      'An unexpected error occurred';

  console.log('Error handler using message:', errorMessage);
                      
  // Show toast with error message
  toast({
    title: "Error",
    description: errorMessage,
    variant: "destructive",
    duration: 5000, // Show for 5 seconds
  });
};

// Specific error handlers for common scenarios
export const handleAuthError = (error: ErrorResponse) => {
  const status = error.response?.status;
  
  if (status === 401) {
    handleError(error, 'Your session has expired. Please log in again.');
  } else if (status === 403) {
    handleError(error, 'You do not have permission to perform this action.');
  } else {
    handleError(error, 'Authentication error occurred.');
  }
};

export const handleNetworkError = (error: ErrorResponse) => {
  handleError(error, 'Network error. Please check your internet connection.');
};

export const handleValidationError = (error: ErrorResponse) => {
  handleError(error, 'Please check your input and try again.');
};

export const handleServerError = (error: ErrorResponse) => {
  handleError(error, 'Server error occurred. Please try again later.');
}; 