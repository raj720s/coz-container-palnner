import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import superAxios from '@/utils/superAxios';
import { RootState } from '@/store';
import { simplifiedRBACService } from '@/services/simplifiedRBACService';
import { privilegeService } from '@/services/privilegeService';

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

      // For now, skip server privilege fetching since we're using static privileges
      // TODO: Re-enable when server integration is ready
      /*
      // Then get privileges
      const privilegeInfo = await simplifiedRBACService.getRolePrivilegesFromServer(userId);
      const privilegeResponse = await privilegeService.getPrivileges({ role_id: roleId });
      const roleId = privilegeInfo.role_id || userInfo.role_id;
      const privilegeNames = privilegeService.extractPrivilegeNames(privilegeResponse.results);
      */

      // Return basic user info without privileges for now
      return {
        userInfo,
        privileges: [], // Empty for now, will be populated by AuthContext
        roleId: userInfo.role_id
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

      const privilegeInfo = await simplifiedRBACService.getRolePrivilegesFromServer(currentUser.id);
      
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

// Async Thunk for fetching privileges from server API
export const fetchUserPrivileges = createAsyncThunk(
  'userInfo/fetchUserPrivileges',
  async (request: { role_id: number }, { rejectWithValue }) => {
    try {
      // For now, return empty privileges since we're using static privileges from AuthContext
      // TODO: Re-enable server privilege fetching when ready
      console.log('ℹ️ Using static privileges from AuthContext, skipping server fetch');
      
      return {
        privileges: [], // Will be populated by AuthContext
        role_id: request.role_id,
        success: true
      };
      
      /*
      // Server privilege fetching (commented out for now)
      const response = await privilegeService.getPrivileges(request);
      return response;
      */
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to fetch user privileges'
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
      })

      // Fetch User Privileges from Server API
      .addCase(fetchUserPrivileges.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserPrivileges.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Update RBAC user with new privileges
        if (state.rbacUser) {
          state.rbacUser.privileges = action.payload.privileges;
          state.rbacUser.privilege_version = `server_${action.payload.fetchedAt}`;
        }
        
        // Also update userInfo if it exists
        if (state.userInfo) {
          state.userInfo.privileges = action.payload.privileges;
          state.userInfo.privilege_version = `server_${action.payload.fetchedAt}`;
        }
        
        state.privilegeVersion = `server_${action.payload.fetchedAt}`;
        state.lastPrivilegeCheck = action.payload.fetchedAt;
        state.error = null;
        
        console.log('✅ Privileges updated from server:', action.payload.privileges);
      })
      .addCase(fetchUserPrivileges.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        console.error('❌ Failed to fetch privileges:', action.payload);
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

// Export selectors with proper memoization
export const selectUserInfo = createSelector(
  [(state: RootState) => state.userInfo.userInfo,
   (state: RootState) => state.userInfo.isLoading,
   (state: RootState) => state.userInfo.error,
   (state: RootState) => state.userInfo.isInitialized,
   (state: RootState) => state.userInfo.lastFetched],
  (userInfo, loading, error, isInitialized, lastFetched) => ({
    data: userInfo,
    loading,
    error,
    isInitialized,
    lastFetched,
  })
);

export const selectRBACUser = createSelector(
  [(state: RootState) => state.userInfo.rbacUser,
   (state: RootState) => state.userInfo.isLoading,
   (state: RootState) => state.userInfo.error,
   (state: RootState) => state.userInfo.isInitialized,
   (state: RootState) => state.userInfo.privilegeVersion,
   (state: RootState) => state.userInfo.lastPrivilegeCheck],
  (rbacUser, loading, error, isInitialized, privilegeVersion, lastPrivilegeCheck) => ({
    data: rbacUser,
    loading,
    error,
    isInitialized,
    privilegeVersion,
    lastPrivilegeCheck,
  })
);

export const selectUserPrivileges = createSelector(
  [(state: RootState) => state.userInfo.rbacUser?.privileges],
  (privileges) => privileges || []
);

export const selectUserRole = createSelector(
  [(state: RootState) => state.userInfo.rbacUser?.role_id],
  (roleId) => roleId || 0
);

export const selectIsSuperUser = createSelector(
  [(state: RootState) => state.userInfo.rbacUser?.is_superuser],
  (isSuperUser) => isSuperUser || false
);

export const selectPrivilegeVersion = createSelector(
  [(state: RootState) => state.userInfo.privilegeVersion],
  (privilegeVersion) => privilegeVersion
);

export const selectPrivilegeChangeDetected = createSelector(
  [(state: RootState) => state.userInfo.error],
  (error) => error === 'PRIVILEGE_CHANGED'
);

export const selectUserInfoLoading = createSelector(
  [(state: RootState) => state.userInfo.isLoading],
  (loading) => loading
);

export const selectUserInfoError = createSelector(
  [(state: RootState) => state.userInfo.error],
  (error) => error
);

export const selectUserInfoInitialized = createSelector(
  [(state: RootState) => state.userInfo.isInitialized],
  (isInitialized) => isInitialized
);

export const selectUserInfoLastFetched = createSelector(
  [(state: RootState) => state.userInfo.lastFetched],
  (lastFetched) => lastFetched
);

// Export reducer
export default userInfoSlice.reducer;
