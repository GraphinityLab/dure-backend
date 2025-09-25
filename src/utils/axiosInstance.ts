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
 * Add a request interceptor to include:
 *  - Authorization (JWT)
 *  - Permissions (for RBAC)
 *  - Identity headers (first/last name, staff ID) for ChangeLogs
 */
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      // 🔑 JWT token for authentication
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 🔑 Permissions for RBAC
      const permissionsString = localStorage.getItem('permissions');
      if (permissionsString) {
        const permissions = JSON.parse(permissionsString);
        if (Array.isArray(permissions)) {
          config.headers['x-user-permissions'] = permissionsString;
        }
      }

      // 🔑 Identity headers for ChangeLogs
      const firstName = localStorage.getItem('first_name');
      const lastName = localStorage.getItem('last_name');
      const staffId = localStorage.getItem('staff_id');

      if (firstName) config.headers['x-first-name'] = firstName;
      if (lastName) config.headers['x-last-name'] = lastName;
      if (staffId) config.headers['x-staff-id'] = staffId;
    } catch (error) {
      console.error('Failed to retrieve data from local storage:', error);
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
