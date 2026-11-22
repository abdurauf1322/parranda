/**
 * API Configuration Helper
 * Resolves base API URL based on VITE_API_URL environment variable.
 */
export const API_BASE_URL: string = (
  (import.meta.env.VITE_API_URL as string | undefined) || ''
).replace(/\/$/, '');

export function apiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!API_BASE_URL) {
    return cleanEndpoint;
  }
  return `${API_BASE_URL}${cleanEndpoint}`;
}
