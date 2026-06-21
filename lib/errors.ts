// lib/errors.ts - Shared error handling utilities for all components

/**
 * Get a user-friendly error message based on HTTP status code
 */
export const getErrorMessage = (status: number, data?: any): string => {
  // If there's a specific error message from the API, use it
  if (data?.error) {
    return data.error;
  }

  // Map status codes to user-friendly messages
  switch (status) {
    // 4xx Client Errors
    case 400:
      return 'Please check your information and try again.';
    case 401:
      return 'Invalid email or password. Please try again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This email is already registered. Please sign in instead.';
    case 422:
      return 'The provided information could not be processed.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    
    // File upload specific errors
    case 413:
      return 'The file is too large. Please upload a smaller file.';
    case 415:
      return 'Unsupported file type. Please upload a valid file.';
    
    // 5xx Server Errors
    case 500:
      return 'Server error. Please try again later.';
    case 502:
      return 'The server is temporarily unavailable. Please try again.';
    case 503:
      return 'Service unavailable. Please try again later.';
    case 504:
      return 'Request timed out. Please try again.';
    
    // Default
    default:
      return 'Something went wrong. Please try again.';
  }
};

/**
 * Get a user-friendly error message for network/connection errors
 */
export const getNetworkErrorMessage = (error: any): string => {
  if (!error) return 'Something went wrong. Please try again.';
  
  if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
    return 'Network error. Please check your connection and try again.';
  }
  if (error?.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  if (error?.message?.includes('aborted')) {
    return 'The request was cancelled. Please try again.';
  }
  return 'Something went wrong. Please try again.';
};

/**
 * Get a user-friendly error message for file upload errors
 */
export const getFileUploadErrorMessage = (error: any): string => {
  if (!error) return 'Failed to upload file. Please try again.';
  
  if (error?.message?.includes('too large')) {
    return 'The file is too large. Maximum size is 10MB.';
  }
  if (error?.message?.includes('type') || error?.message?.includes('format')) {
    return 'Unsupported file type. Please upload a PDF file.';
  }
  if (error?.message?.includes('permission')) {
    return 'You do not have permission to upload files.';
  }
  return 'Failed to upload file. Please try again.';
};

/**
 * Get a user-friendly error message for PDF generation errors
 */
export const getPDFGenerationErrorMessage = (error: any): string => {
  if (!error) return 'Failed to generate PDF. Please try again.';
  
  if (error?.message?.includes('encoding')) {
    return 'Failed to generate PDF due to encoding issues. Please check the content.';
  }
  if (error?.message?.includes('memory')) {
    return 'PDF generation failed due to memory issues. Please try with smaller content.';
  }
  return 'Failed to generate PDF. Please try again.';
};