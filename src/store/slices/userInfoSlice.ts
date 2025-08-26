import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import superAxios from '@/utils/superAxios';
import { RootState } from '@/store';
import { rbacService } from '@/services/rbacService';

// User Info API Response Interface
export interface UserInfoResponse {
  id: number;
  email: string;
  is_superuser: boolean;
  first_name: string;
  last_name: string;
  organisation_name: string;
  country_code: string;
  phone_number: string;
  created_on_start_date: string;
  created_on_end_date: string;
  created_by: number;
  created_by_name: string;
  modified_on_start_date: string;
  modified_on_end_date: string;
  last_login_start_date: string;
  last_login_end_date: string;
  modified_by: number;
  modified_by_name: string;
  page: number;
  page_size: number;
  status: number;
  role_id: number;
  role_name: string;
  export: boolean;
  // RBAC Enhancement
  privileges?: string[];
  privilege_version?: string; // For detecting privilege changes
}

// Enhanced User Interface for RBAC
export interface RBACUser {
  id: number;
  email: string;
  name: string;
  role_id: number;
  role_name: string;
  is_superuser: boolean;
  privileges: string[];
  privilege_version: string;
}

// User Info State Interface
interface UserInfoState {
  userInfo: UserInfoResponse | null;
  rbacUser: RBACUser | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  isInitialized: boolean;
  privilegeVersion: string | null;
  lastPrivilegeCheck: number | null;
}

// Initial State
const initialState: UserInfoState = {
  userInfo: null,
  rbacUser: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  isInitialized: false,
  privilegeVersion: null,
  lastPrivilegeCheck: null,
};

// Async Thunk for fetching user info
export const fetchUserInfo = createAsyncThunk(
  'userInfo/fetchUserInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await superAxios.get('/user/v1/json-info');
      return response.data;
    } catch (error: any) {
      // Error handling
      return rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to fetch user info'
      );
    }
  }
);

// Async Thunk for fetching user RBAC privileges
export const fetchUserRBACInfo = createAsyncThunk(
  'userInfo/fetchUserRBACInfo',
  async (userId: number, { rejectWithValue }) => {
    try {
      // First get basic user info
      const userResponse = await superAxios.get('/user/v1/json-info');
      const userInfo = userResponse.data;

      // Then get privileges
      const privilegeInfo = await rbacService.getUserPrivileges(userId);

      // Combine into RBAC user object
      const rbacUser: RBACUser = {
        id: userInfo.id || userId,
        email: userInfo.email,
        name: `${userInfo.first_name} ${userInfo.last_name}`.trim(),
        role_id: privilegeInfo.role_id,
        role_name: privilegeInfo.role_name,
        is_superuser: userInfo.is_superuser || false,
        privileges: privilegeInfo.privileges,
        privilege_version: privilegeInfo.privilege_version,
      };

      return {
        userInfo,
        rbacUser,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to fetch user RBAC info'
      );
    }
  }
);

// Async Thunk for checking privilege changes
export const checkPrivilegeChanges = createAsyncThunk(
  'userInfo/checkPrivilegeChanges',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const currentUser = state.userInfo.rbacUser;
      
      if (!currentUser) {
        throw new Error('No current user found');
      }

      const privilegeInfo = await rbacService.getUserPrivileges(currentUser.id);
      
      return {
        hasChanged: privilegeInfo.privilege_version !== currentUser.privilege_version,
        newPrivilegeVersion: privilegeInfo.privilege_version,
        newPrivileges: privilegeInfo.privileges,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to check privilege changes'
      );
    }
  }
);

// User Info Slice
const userInfoSlice = createSlice({
  name: 'userInfo',
  initialState,
  reducers: {
    // Clear user info (useful for logout)
    clearUserInfo: (state) => {
      state.userInfo = null;
      state.rbacUser = null;
      state.isInitialized = false;
      state.lastFetched = null;
      state.privilegeVersion = null;
      state.lastPrivilegeCheck = null;
      state.error = null;
    },
    
    // Set user info manually (useful for testing or direct updates)
    setUserInfo: (state, action: PayloadAction<UserInfoResponse>) => {
      state.userInfo = action.payload;
      state.isInitialized = true;
      state.lastFetched = Date.now();
      state.error = null;
    },

    // Set RBAC user info
    setRBACUser: (state, action: PayloadAction<RBACUser>) => {
      state.rbacUser = action.payload;
      state.privilegeVersion = action.payload.privilege_version;
      state.lastPrivilegeCheck = Date.now();
      state.isInitialized = true;
      state.error = null;
    },
    
    // Update specific user info fields
    updateUserInfo: (state, action: PayloadAction<Partial<UserInfoResponse>>) => {
      if (state.userInfo) {
        state.userInfo = { ...state.userInfo, ...action.payload };
        state.lastFetched = Date.now();
      }
    },

    // Update user privileges
    updateUserPrivileges: (state, action: PayloadAction<{ privileges: string[]; version: string }>) => {
      if (state.rbacUser) {
        state.rbacUser.privileges = action.payload.privileges;
        state.rbacUser.privilege_version = action.payload.version;
        state.privilegeVersion = action.payload.version;
        state.lastPrivilegeCheck = Date.now();
      }
    },

    // Mark privilege version as checked
    markPrivilegeChecked: (state) => {
      state.lastPrivilegeCheck = Date.now();
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Info
      .addCase(fetchUserInfo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserInfo.fulfilled, (state, action: PayloadAction<UserInfoResponse>) => {
        state.isLoading = false;
        state.userInfo = action.payload;
        state.isInitialized = true;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchUserInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isInitialized = true;
      })

      // Fetch User RBAC Info
      .addCase(fetchUserRBACInfo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserRBACInfo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userInfo = action.payload.userInfo;
        state.rbacUser = action.payload.rbacUser;
        state.privilegeVersion = action.payload.rbacUser.privilege_version;
        state.lastFetched = Date.now();
        state.lastPrivilegeCheck = Date.now();
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(fetchUserRBACInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isInitialized = true;
      })

      // Check Privilege Changes
      .addCase(checkPrivilegeChanges.pending, (state) => {
        // Don't set loading for background checks
        state.error = null;
      })
      .addCase(checkPrivilegeChanges.fulfilled, (state, action) => {
        state.lastPrivilegeCheck = Date.now();
        if (action.payload.hasChanged) {
          // Don't automatically update privileges here - let the component handle re-login
          state.error = 'PRIVILEGE_CHANGED';
        }
      })
      .addCase(checkPrivilegeChanges.rejected, (state, action) => {
        // Silently fail privilege checks to avoid interrupting user experience
        console.warn('Privilege check failed:', action.payload);
      });
  },
});

// Export actions
export const {
  clearUserInfo,
  setUserInfo,
  setRBACUser,
  updateUserInfo,
  updateUserPrivileges,
  markPrivilegeChecked,
  clearError,
  setLoading,
} = userInfoSlice.actions;

// Export selectors
export const selectUserInfo = (state: RootState) => ({
  data: state.userInfo.userInfo,
  loading: state.userInfo.isLoading,
  error: state.userInfo.error,
  isInitialized: state.userInfo.isInitialized,
  lastFetched: state.userInfo.lastFetched,
});

export const selectRBACUser = (state: RootState) => ({
  data: state.userInfo.rbacUser,
  loading: state.userInfo.isLoading,
  error: state.userInfo.error,
  isInitialized: state.userInfo.isInitialized,
  privilegeVersion: state.userInfo.privilegeVersion,
  lastPrivilegeCheck: state.userInfo.lastPrivilegeCheck,
});

export const selectUserPrivileges = (state: RootState) => state.userInfo.rbacUser?.privileges || [];
export const selectUserRole = (state: RootState) => state.userInfo.rbacUser?.role_id || 0;
export const selectIsSuperUser = (state: RootState) => state.userInfo.rbacUser?.is_superuser || false;
export const selectPrivilegeVersion = (state: RootState) => state.userInfo.privilegeVersion;
export const selectPrivilegeChangeDetected = (state: RootState) => state.userInfo.error === 'PRIVILEGE_CHANGED';

export const selectUserInfoLoading = (state: { userInfo: UserInfoState }) => state.userInfo.isLoading;
export const selectUserInfoError = (state: { userInfo: UserInfoState }) => state.userInfo.error;
export const selectUserInfoInitialized = (state: { userInfo: UserInfoState }) => state.userInfo.isInitialized;
export const selectUserInfoLastFetched = (state: { userInfo: UserInfoState }) => state.userInfo.lastFetched;

// Export reducer
export default userInfoSlice.reducer;
