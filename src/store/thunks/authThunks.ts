import { createAsyncThunk } from '@reduxjs/toolkit';
import { loginSuccess, loginFailure, setLoading, logout } from '../slices/authSlice';
import superAxios from '@/utils/superAxios';
import { User } from '../slices/authSlice';

// Types for auth
interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  user: User;
  token: string;
  refresh_token?: string;
  expires_in?: number;
}

interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  organisation_name: string;
  role?: number;
}

// Login thunk
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginCredentials, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      
      const response = await superAxios.post<LoginResponse>('/auth/login', credentials);
      const { user, token, refresh_token } = response.data;
      
      // Store tokens in localStorage if remember me is checked
      if (credentials.rememberMe) {
        localStorage.setItem('authToken', token);
        if (refresh_token) {
          localStorage.setItem('refreshToken', refresh_token);
        }
      }
      
      dispatch(loginSuccess({ 
        user, 
        token, 
        refreshToken: refresh_token 
      }));
      
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch(loginFailure(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Register thunk
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: RegisterData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      
      const response = await superAxios.post<LoginResponse>('/auth/register', userData);
      const { user, token, refresh_token } = response.data;
      
      dispatch(loginSuccess({ 
        user, 
        token, 
        refreshToken: refresh_token 
      }));
      
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch(loginFailure(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Logout thunk
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { dispatch, getState }) => {
    try {
      // Get current state
      const state = getState() as any;
      const token = state.auth.token;
      
      // Call logout endpoint if token exists
      if (token) {
        try {
          await superAxios.post('/auth/logout');
        } catch (error) {
          // Continue with logout even if API call fails
          console.warn('Logout API call failed:', error);
        }
      }
      
      // Clear stored tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      
      // Clear Redux state
      dispatch(logout());
      
      return true;
    } catch (error: any) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      dispatch(logout());
      return true;
    }
  }
);

// Refresh token thunk
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const refreshTokenValue = state.auth.refreshToken;
      
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }
      
      const response = await superAxios.post<{ token: string; refresh_token?: string }>('/auth/refresh', {
        refresh_token: refreshTokenValue
      });
      
      const { token, refresh_token } = response.data;
      
      // Update tokens in localStorage
      localStorage.setItem('authToken', token);
      if (refresh_token) {
        localStorage.setItem('refreshToken', refresh_token);
      }
      
      return { token, refreshToken: refresh_token };
    } catch (error: any) {
      // If refresh fails, logout user
      dispatch(logoutUser());
      return rejectWithValue('Token refresh failed');
    }
  }
);

// Verify token thunk (for app initialization)
export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      // Verify token with backend
      const response = await superAxios.get<{ user: User }>('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const refreshTokenValue = localStorage.getItem('refreshToken');
      
      dispatch(loginSuccess({ 
        user: response.data.user, 
        token,
        refreshToken: refreshTokenValue 
      }));
      
      return response.data;
    } catch (error: any) {
      // Clear invalid tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      return rejectWithValue('Token verification failed');
    }
  }
);

// Update profile thunk
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: Partial<User>, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const userId = state.auth.user?.id;
      
      if (!userId) {
        throw new Error('User not found');
      }
      
      const response = await superAxios.put<User>(`/user/v1/${userId}`, profileData);
      
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Profile update failed';
      return rejectWithValue(message);
    }
  }
);

// Change password thunk
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (
    { currentPassword, newPassword }: { currentPassword: string; newPassword: string },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as any;
      const userId = state.auth.user?.id;
      
      if (!userId) {
        throw new Error('User not found');
      }
      
      await superAxios.put(`/auth/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Password change failed';
      return rejectWithValue(message);
    }
  }
);

// Reset password thunk
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      await superAxios.post('/auth/reset-password', { email });
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Password reset failed';
      return rejectWithValue(message);
    }
  }
);
