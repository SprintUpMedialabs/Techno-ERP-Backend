import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { AUDIT_LOG_SERVICE_URL, SERVICE_AUTH_TOKEN } from '../secrets';

// Create instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: AUDIT_LOG_SERVICE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to get token (customize this as per your logic)
async function getAuthToken(): Promise<string | null> {
  // Example: static token from .env or dynamic logic
  return SERVICE_AUTH_TOKEN;
}

// Interceptor to attach Bearer token
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // return Promise.reject(error);
  }
);

export default axiosInstance;
