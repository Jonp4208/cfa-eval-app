/**
 * Get the authentication header with the JWT token
 * @returns Object with Authorization header or empty object if no token
 */
export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}; 