import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';

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
  status?: boolean;
  created_on?: string;
  updated_on?: string;
  phone_number?: string | null;
  country_code?: string | null;
  country?: string | null;
  timezone?: string | null;
}

export interface AuthState {
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
        // IMPORTANT: Preserve critical login information (role_id, is_superuser) 
        // as these are set during login and should not be overridden by API
        const apiData = action.payload;
        state.user = {
          ...state.user,
          first_name: apiData.first_name || state.user.first_name,
          last_name: apiData.last_name || state.user.last_name,
          email: apiData.email || state.user.email,
          organisation_name: apiData.organisation_name || state.user.organisation_name,
          // Preserve login role information - DO NOT override from API
          role: state.user.role, // Keep login role
          role_id: state.user.role_id, // Keep login role_id
          is_superuser: state.user.is_superuser, // Keep login superuser status
          status: apiData.status !== undefined ? apiData.status : state.user.status,
          created_on: apiData.created_on || state.user.created_on,
          phone_number: apiData.phone_number !== undefined ? apiData.phone_number : state.user.phone_number,
          country_code: apiData.country_code !== undefined ? apiData.country_code : state.user.country_code,
          country: apiData.country !== undefined ? apiData.country : state.user.country,
          timezone: apiData.timezone !== undefined ? apiData.timezone : state.user.timezone,
        };
        
        console.log('🔐 Profile updated from API - preserved login role info:', {
          role: state.user.role,
          role_id: state.user.role_id,
          is_superuser: state.user.is_superuser
        });
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

// Selectors with proper memoization
export const selectAuth = createSelector(
  [(state: RootState) => state.auth],
  (auth) => auth
);

export const selectUser = createSelector(
  [(state: RootState) => state.auth.user],
  (user) => user
);

export const selectToken = createSelector(
  [(state: RootState) => state.auth.token],
  (token) => token
);

export const selectIsAuthenticated = createSelector(
  [(state: RootState) => state.auth.isAuthenticated],
  (isAuthenticated) => isAuthenticated
);

export const selectAuthLoading = createSelector(
  [(state: RootState) => state.auth.isLoading],
  (loading) => loading
);

export const selectAuthError = createSelector(
  [(state: RootState) => state.auth.error],
  (error) => error
);

export default authSlice.reducer;
