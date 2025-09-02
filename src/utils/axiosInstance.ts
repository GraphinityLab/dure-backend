import axios, { AxiosError, AxiosInstance } from 'axios';

/**
 * Define the base URL for your API.
 * The variable must be prefixed with NEXT_PUBLIC_ to be accessible
 * on the client side in Next.js.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Create a custom Axios instance with the base URL.
const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Add a request interceptor to include the Authorization and permissions headers.
 *
 * This interceptor runs before every request is sent. It checks for a JWT token
 * and a 'permissions' item in the browser's local storage.
 *
 * If a token is found, it adds an 'Authorization: Bearer <token>' header.
 * If permissions are found, it adds a custom 'x-user-permissions' header.
 * This is crucial for authenticating requests and for backend permission checks.
 */
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      // Retrieve the JWT token from local storage
      const token = localStorage.getItem('token');
      if (token) {
        // Add the Authorization header for authentication
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Retrieve the permissions string from local storage
      const permissionsString = localStorage.getItem('permissions');
      if (permissionsString) {
        // Parse the JSON string to get the permissions array
        const permissions = JSON.parse(permissionsString);
        
        // Check if the permissions array is valid before adding the header
        if (Array.isArray(permissions)) {
          config.headers['x-user-permissions'] = permissionsString;
        }
      }
    } catch (error) {
      // Log any errors that occur during parsing, but do not block the request.
      console.error('Failed to retrieve data from local storage:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

// Export the configured Axios instance for use throughout the application.
export default axiosInstance;
