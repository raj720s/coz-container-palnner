import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import { privilegeService } from '@/services/privilegeService';
import { authService } from '@/services/authService';

// User Profile API Response Interface (from /api/user/v1/profile)
export interface UserProfileAPIResponse {
  id: number;
  is_superuser: boolean;
  announcement_read_flag: number;
  role: Array<{
    id: number;
    role_name: string;
  }>;
  email: string;
  first_name: string;
  last_name: string;
  created_on: string;
  last_login: string;
  status: boolean;
  country_code: string | null;
  is_deleted: boolean;
  phone_number: string | null;
  modified_on: string | null;
  organisation_name: string;
  timezone: string | null;
  country: string | null;
  created_by: number | null;
  modified_by: number | null;
}

// Privilege API Response Interface (from /api/admin/v1/privilege/list)
export interface PrivilegeAPIResponse {
  count: number;
  results: Array<{
    module_id: string;
    privileges: Array<{
      id: number;
      privilege_name: string;
      privilege_desc: string;
    }>;
  }>;
}

// Complete User State Interface
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
  // Additional profile fields
  last_login?: string;
  modified_on?: string | null;
  created_by?: number | null;
  modified_by?: number | null;
  is_deleted?: boolean;
  announcement_read_flag?: number;
  // RBAC fields
  privileges: string[];
  modules: string[];
  privilege_version: string;
}

export interface UserState {
  // Authentication state
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  // Loading and error states
  isLoading: boolean;
  profileLoading: boolean;
  privilegesLoading: boolean;
  error: string | null;
  profileError: string | null;
  privilegesError: string | null;
  
  // Initialization state
  isInitialized: boolean;
  lastLoginTime: number | null;
  lastUpdated: number | null;
}

// Initial state
const initialState: UserState = {
  // Authentication state
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  
  // Loading and error states
  isLoading: false,
  profileLoading: false,
  privilegesLoading: false,
  error: null,
  profileError: null,
  privilegesError: null,
  
  // Initialization state
  isInitialized: false,
  lastLoginTime: null,
  lastUpdated: null,
};

// Async thunk to fetch user profile
export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getUserProfile();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user profile');
    }
  }
);

// Async thunk to fetch user privileges
export const fetchUserPrivileges = createAsyncThunk(
  'user/fetchUserPrivileges',
  async (roleId: number, { rejectWithValue }) => {
    try {
      const response = await privilegeService.getPrivileges({ role_id: roleId });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user privileges');
    }
  }
);

// Async thunk to initialize complete user state
export const initializeUserState = createAsyncThunk(
  'user/initializeUserState',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // First fetch user profile
      const profileResult = await dispatch(fetchUserProfile()).unwrap();
      
      // Check if user is superuser - if so, skip privilege fetching
      if (profileResult.is_superuser) {
        console.log('🔐 Superuser detected, skipping privilege fetching');
        return { profile: profileResult, privileges: null };
      }
      
      // Extract role_id from profile
      const roleId = profileResult.role?.[0]?.id || 0;
      
      if (roleId > 0) {
        // Then fetch privileges for the role
        const privilegesResult = await dispatch(fetchUserPrivileges(roleId)).unwrap();
        return { profile: profileResult, privileges: privilegesResult };
      } else {
        return { profile: profileResult, privileges: null };
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initialize user state');
    }
  }
);

// User Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Authentication actions
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
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
      state.lastUpdated = Date.now();
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
      state.profileError = null;
      state.privilegesError = null;
      state.isInitialized = false;
      state.lastLoginTime = null;
      state.lastUpdated = null;
    },
    
    // Update user profile
    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        state.lastUpdated = Date.now();
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
    
    // Refresh token success
    refreshTokenSuccess: (state, action: PayloadAction<{ token: string }>) => {
      state.token = action.payload.token;
      state.isLoading = false;
      state.error = null;
    },
    
    // Refresh token failure
    refreshTokenFailure: (state, action: PayloadAction<string>) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = action.payload;
      state.lastLoginTime = null;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set user profile data
    setUserProfile: (state, action: PayloadAction<UserProfileAPIResponse>) => {
      const profile = action.payload;
      if (state.user) {
        state.user.id = profile.id;
        state.user.email = profile.email;
        state.user.first_name = profile.first_name;
        state.user.last_name = profile.last_name;
        state.user.organisation_name = profile.organisation_name;
        state.user.phone_number = profile.phone_number;
        state.user.country_code = profile.country_code;
        state.user.country = profile.country;
        state.user.timezone = profile.timezone;
        state.user.status = profile.status;
        state.user.is_superuser = profile.is_superuser;
        state.user.created_on = profile.created_on;
        state.user.last_login = profile.last_login;
        state.user.modified_on = profile.modified_on;
        state.user.created_by = profile.created_by;
        state.user.modified_by = profile.modified_by;
        state.user.is_deleted = profile.is_deleted;
        state.user.announcement_read_flag = profile.announcement_read_flag;

        // Set role info
        if (profile.role && profile.role.length > 0) {
          state.user.role_id = profile.role[0].id;
          state.user.role = profile.role[0].role_name;
        }

        state.profileLoading = false;
        state.profileError = null;
        state.lastUpdated = Date.now();
      }
    },

    // Set user privileges
    setUserPrivileges: (state, action: PayloadAction<PrivilegeAPIResponse>) => {
      const privilegesData = action.payload;
      const allPrivileges: string[] = [];
      const allModules: string[] = [];

      privilegesData.results.forEach(module => {
        allModules.push(module.module_id);
        module.privileges.forEach(privilege => {
          allPrivileges.push(privilege.privilege_name);
        });
      });

      if (state.user) {
        state.user.privileges = allPrivileges;
        state.user.modules = allModules;
        state.user.privilege_version = `api_${Date.now()}`;
      }
      
      state.privilegesLoading = false;
      state.privilegesError = null;
      state.lastUpdated = Date.now();
    },

    // Update specific user fields
    updateUserField: (state, action: PayloadAction<{ field: keyof User; value: any }>) => {
      const { field, value } = action.payload;
      if (state.user) {
        (state.user as any)[field] = value;
        state.lastUpdated = Date.now();
      }
    },

    // Set loading states
    setProfileLoading: (state, action: PayloadAction<boolean>) => {
      state.profileLoading = action.payload;
    },

    setPrivilegesLoading: (state, action: PayloadAction<boolean>) => {
      state.privilegesLoading = action.payload;
    },

    // Set error states
    setProfileError: (state, action: PayloadAction<string | null>) => {
      state.profileError = action.payload;
    },

    setPrivilegesError: (state, action: PayloadAction<string | null>) => {
      state.privilegesError = action.payload;
    },

    // Mark as initialized
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Profile
      .addCase(fetchUserProfile.pending, (state: UserState) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state: UserState, action) => {
        const profile = action.payload;
        if (state.user) {
          state.user.id = profile.id;
          state.user.email = profile.email;
          state.user.first_name = profile.first_name;
          state.user.last_name = profile.last_name;
          state.user.organisation_name = profile.organisation_name;
          state.user.phone_number = profile.phone_number;
          state.user.country_code = profile.country_code;
          state.user.country = profile.country;
          state.user.timezone = profile.timezone;
          state.user.status = profile.status;
          state.user.is_superuser = profile.is_superuser;
          state.user.created_on = profile.created_on;
          state.user.last_login = profile.last_login;
          state.user.modified_on = profile.modified_on;
          state.user.created_by = profile.created_by;
          state.user.modified_by = profile.modified_by;
          state.user.is_deleted = profile.is_deleted;
          state.user.announcement_read_flag = profile.announcement_read_flag;

          // Set role info
          if (profile.role && profile.role.length > 0) {
            state.user.role_id = profile.role[0].id;
            state.user.role = profile.role[0].role_name;
          }
        }

        state.profileLoading = false;
        state.profileError = null;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchUserProfile.rejected, (state: UserState, action) => {
        state.profileLoading = false;
        state.profileError = action.payload as string;
      })

      // Fetch User Privileges
      .addCase(fetchUserPrivileges.pending, (state: UserState) => {
        state.privilegesLoading = true;
        state.privilegesError = null;
      })
      .addCase(fetchUserPrivileges.fulfilled, (state: UserState, action) => {
        const privilegesData = action.payload;
        const allPrivileges: string[] = [];
        const allModules: string[] = [];

        privilegesData.results.forEach(module => {
          allModules.push(module.module_id);
          module.privileges.forEach(privilege => {
            allPrivileges.push(privilege.privilege_name);
          });
        });

        if (state.user) {
          state.user.privileges = allPrivileges;
          state.user.modules = allModules;
          state.user.privilege_version = `api_${Date.now()}`;
        }
        
        state.privilegesLoading = false;
        state.privilegesError = null;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchUserPrivileges.rejected, (state: UserState, action) => {
        state.privilegesLoading = false;
        state.privilegesError = action.payload as string;
      })

      // Initialize User State
      .addCase(initializeUserState.pending, (state: UserState) => {
        state.profileLoading = true;
        state.privilegesLoading = true;
        state.profileError = null;
        state.privilegesError = null;
      })
      .addCase(initializeUserState.fulfilled, (state: UserState, action) => {
        const { profile, privileges } = action.payload;
        
        if (state.user) {
          // Set profile data
          state.user.id = profile.id;
          state.user.email = profile.email;
          state.user.first_name = profile.first_name;
          state.user.last_name = profile.last_name;
          state.user.organisation_name = profile.organisation_name;
          state.user.phone_number = profile.phone_number;
          state.user.country_code = profile.country_code;
          state.user.country = profile.country;
          state.user.timezone = profile.timezone;
          state.user.status = profile.status;
          state.user.is_superuser = profile.is_superuser;
          state.user.created_on = profile.created_on;
          state.user.last_login = profile.last_login;
          state.user.modified_on = profile.modified_on;
          state.user.created_by = profile.created_by;
          state.user.modified_by = profile.modified_by;
          state.user.is_deleted = profile.is_deleted;
          state.user.announcement_read_flag = profile.announcement_read_flag;

          // Set role info
          if (profile.role && profile.role.length > 0) {
            state.user.role_id = profile.role[0].id;
            state.user.role = profile.role[0].role_name;
          }

          // Set privileges - handle superusers specially
          console.log('🔐 Processing user privileges', { 
            isSuperuser: profile.is_superuser, 
            hasPrivileges: !!privileges,
            profileRole: profile.role?.[0]?.role_name
          });

          if (profile.is_superuser) {
            // For superusers, give them all privileges and modules
            console.log('🔐 Superuser detected, granting all privileges and modules');
            const allPrivileges: string[] = [];
            const allModules: string[] = [];

            // Get all privileges and modules from static module definitions
            const { staticModuleDefinitions } = require('@/config/staticModules');
            console.log('🔐 Static Module Definitions:', Object.keys(staticModuleDefinitions.modules));

            Object.values(staticModuleDefinitions.modules).forEach((module: any) => {
              console.log('🔐 Processing module:', module);
              allModules.push(module.id.toString());
              allPrivileges.push(...(module.privileges || []));
            });

            state.user.privileges = [...new Set(allPrivileges)]; // Remove duplicates
            state.user.modules = allModules;
            state.user.privilege_version = `superuser_${Date.now()}`;

            console.log('🔐 Superuser Privileges:', {
              privileges: state.user.privileges,
              modules: state.user.modules
            });

            // Update session storage with privileges and modules
            if (typeof window !== 'undefined') {
              const storedUser = sessionStorage.getItem('auth_user');
              if (storedUser) {
                const userData = JSON.parse(storedUser);
                userData.privileges = state.user.privileges;
                userData.modules = state.user.modules;
                userData.privilege_version = state.user.privilege_version;
                userData.is_superuser = true;
                sessionStorage.setItem('auth_user', JSON.stringify(userData));
                console.log('🔐 Updated session storage with superuser privileges and modules', { 
                  privileges: state.user.privileges.length, 
                  modules: state.user.modules.length 
                });
              }
            }
          } else if (privileges) {
            // For regular users, use API privileges
            const allPrivileges: string[] = [];
            const allModules: string[] = [];

            privileges.results.forEach(module => {
              allModules.push(module.module_id);
              module.privileges.forEach(privilege => {
                allPrivileges.push(privilege.privilege_name);
              });
            });

            state.user.privileges = allPrivileges;
            state.user.modules = allModules;
            state.user.privilege_version = `api_${Date.now()}`;

            // Update session storage with privileges and modules
            if (typeof window !== 'undefined') {
              const storedUser = sessionStorage.getItem('auth_user');
              if (storedUser) {
                const userData = JSON.parse(storedUser);
                userData.privileges = allPrivileges;
                userData.modules = allModules;
                userData.privilege_version = state.user.privilege_version;
                sessionStorage.setItem('auth_user', JSON.stringify(userData));
                console.log('🔐 Updated session storage with privileges and modules', { privileges: allPrivileges.length, modules: allModules.length });
              }
            }
          }
        }

        state.profileLoading = false;
        state.privilegesLoading = false;
        state.profileError = null;
        state.privilegesError = null;
        state.isInitialized = true;
        state.lastUpdated = Date.now();
      })
      .addCase(initializeUserState.rejected, (state, action) => {
        state.profileLoading = false;
        state.privilegesLoading = false;
        state.profileError = action.payload as string;
        state.privilegesError = action.payload as string;
        state.isInitialized = true;
      });
  },
});

// Export actions
export const {
  setLoading,
  setError,
  loginSuccess,
  loginFailure,
  logout,
  updateProfile,
  updateProfileFromAPI,
  updateToken,
  refreshTokenSuccess,
  refreshTokenFailure,
  clearError,
  setUserProfile,
  setUserPrivileges,
  updateUserField,
  setProfileLoading,
  setPrivilegesLoading,
  setProfileError,
  setPrivilegesError,
  setInitialized,
} = userSlice.actions;

// Selectors with proper memoization
export const selectUser = (state: RootState) => state.user.user;

export const selectToken = createSelector(
  [(state: RootState) => state.user.token],
  (token) => token
);

export const selectRefreshToken = createSelector(
  [(state: RootState) => state.user.refreshToken],
  (refreshToken) => refreshToken
);

export const selectIsAuthenticated = (state: RootState) => state.user.isAuthenticated;

export const selectUserLoading = createSelector(
  [(state: RootState) => state.user.isLoading],
  (loading) => loading
);

export const selectUserError = createSelector(
  [(state: RootState) => state.user.error],
  (error) => error
);

export const selectUserProfile = createSelector(
  [(state: RootState) => state.user.user],
  (user) => user ? {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    organisation_name: user.organisation_name,
    phone_number: user.phone_number,
    country_code: user.country_code,
    country: user.country,
    timezone: user.timezone,
    status: user.status,
    is_superuser: user.is_superuser,
    created_on: user.created_on,
    last_login: user.last_login,
    modified_on: user.modified_on,
    created_by: user.created_by,
    modified_by: user.modified_by,
    is_deleted: user.is_deleted,
    announcement_read_flag: user.announcement_read_flag,
  } : null
);

export const selectUserRole = createSelector(
  [(state: RootState) => state.user.user],
  (user) => user ? {
    role_id: user.role_id,
    role_name: user.role,
  } : null
);

export const selectUserPrivileges = createSelector(
  [(state: RootState) => state.user.user],
  (user) => user ? {
    privileges: user.privileges,
    modules: user.modules,
    privilege_version: user.privilege_version,
  } : null
);

export const selectUserLoadingStates = createSelector(
  [(state: RootState) => state.user],
  (userState) => ({
    profileLoading: userState.profileLoading,
    privilegesLoading: userState.privilegesLoading,
    isLoading: userState.isLoading,
  })
);

export const selectUserErrors = createSelector(
  [(state: RootState) => state.user],
  (userState) => ({
    profileError: userState.profileError,
    privilegesError: userState.privilegesError,
    hasError: !!(userState.profileError || userState.privilegesError),
  })
);

export const selectUserInitialized = (state: RootState) => state.user.isInitialized;

export const selectUserLastUpdated = createSelector(
  [(state: RootState) => state.user.lastUpdated],
  (lastUpdated) => lastUpdated
);

export default userSlice.reducer;
