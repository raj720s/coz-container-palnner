import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  organisation_name: string;
  role: string;
  role_id: number;
  is_superuser: boolean;
  is_active?: boolean;
  created_on?: string;
  updated_on?: string;
  phone_number?: string | null;
  country_code?: string | null;
  country?: string | null;
  timezone?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastLoginTime: number | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  lastLoginTime: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Login success
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string; refreshToken?: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || null;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      state.lastLoginTime = Date.now();
    },
    
    // Login failure
    loginFailure: (state, action: PayloadAction<string>) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = action.payload;
      state.lastLoginTime = null;
    },
    
    // Logout
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.lastLoginTime = null;
    },
    
    // Update user profile
    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    
    // Update user profile from API response
    updateProfileFromAPI: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        // Map API response fields to local user state
        const apiData = action.payload;
        state.user = {
          ...state.user,
          first_name: apiData.first_name || state.user.first_name,
          last_name: apiData.last_name || state.user.last_name,
          email: apiData.email || state.user.email,
          organisation_name: apiData.organisation_name || state.user.organisation_name,
          role_id: apiData.role_id || state.user.role_id,
          is_superuser: apiData.is_superuser !== undefined ? apiData.is_superuser : state.user.is_superuser,
          phone_number: apiData.phone_number !== undefined ? apiData.phone_number : state.user.phone_number,
          country_code: apiData.country_code !== undefined ? apiData.country_code : state.user.country_code,
          country: apiData.country !== undefined ? apiData.country : state.user.country,
          timezone: apiData.timezone !== undefined ? apiData.timezone : state.user.timezone,
        };
      }
    },
    
    // Update token
    updateToken: (state, action: PayloadAction<{ token: string; refreshToken?: string }>) => {
      state.token = action.payload.token;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  loginSuccess,
  loginFailure,
  logout,
  updateProfile,
  updateProfileFromAPI,
  updateToken,
  clearError,
} = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

export default authSlice.reducer;
