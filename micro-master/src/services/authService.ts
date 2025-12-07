import { getEmailFromUrl } from '../utils/urlUtils';

interface LoginResponse {
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

/**
 * Simulates validating an autolink email
 */
export const validateAutolink = async (): Promise<string | null> => {
  // In a real implementation, this would make an API call to validate the token/session
  const email = getEmailFromUrl();
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // For demo purposes, we'll just check if an email parameter exists
  // and treat any email with microsoft.com domain as valid
  if (email && (email.endsWith('@microsoft.com') || email.endsWith('@outlook.com'))) {
    return email;
  }
  
  return null;
};

/**
 * Simulates login functionality
 */
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // For demo purposes, accept any non-empty password, but require email to be from microsoft.com
  if (!password) {
    return {
      success: false,
      error: 'Password is required'
    };
  }
  
  if (password.length < 8) {
    return {
      success: false,
      error: 'Password must be at least 8 characters'
    };
  }
  
  // Simulate successful login
  return {
    success: true,
    redirectUrl: '/dashboard'
  };
};