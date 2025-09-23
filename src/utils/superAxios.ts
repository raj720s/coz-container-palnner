import { BASEURL } from '@/config/variables';
import axios from 'axios';
import Cookies from 'js-cookie'

const getToken = () => {
  return process.env.NEXT_PUBLIC_TOKEN;
}

const superAxios = axios.create({
  baseURL: BASEURL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },  
});

// Request interceptor to add authorization header
superAxios.interceptors.request.use(req => {
  // Get token from session storage
  const authToken = localStorage.getItem('auth_token');
  
  // Add authorization header if token exists
  if (authToken) {
    req.headers.Authorization = authToken;
  } else {
    // Fallback to environment token for non-authenticated requests
    req.headers.Authorization = getToken();
  }

  if (req.params?.language) {
    const { language } = req.params
    req.params.ln = language || 'en';
  }
  return req;
})

superAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (refreshToken) {
          // Import authService dynamically to avoid circular dependency
          const { authService } = await import('@/services/authService');
          
          // Attempt to refresh the token
          const newTokens = await authService.refreshToken(refreshToken);
          
          // Update session storage with new access token
          localStorage.setItem('auth_token', `Bearer ${newTokens.access}`);
          
          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
          
          // Retry the original request
          return superAxios(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth_user');
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/signin';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default superAxios;