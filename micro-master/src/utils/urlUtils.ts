/**
 * Extracts parameters from the current URL
 */
export const getUrlParams = (): Record<string, string> => {
  const searchParams = new URLSearchParams(window.location.search);
  const params: Record<string, string> = {};
  
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  
  return params;
};

/**
 * Gets email from URL parameters
 */
export const getEmailFromUrl = (): string | null => {
  const params = getUrlParams();
  return params.email || null;
};