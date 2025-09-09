import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { roleService, RoleListRequest, RoleListResponseV2 } from '@/services/roleService';
import { RoleResponse, RoleListResponse, RoleResponseWithPrivileges } from '@/services/roleService';

interface RoleState {
  roles: RoleResponse[];
  rolesV2: RoleListResponseV2[];
  rolesWithPrivileges: RoleResponseWithPrivileges[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: RoleState = {
  roles: [],
  rolesV2: [],
  rolesWithPrivileges: [],
  loading: false,
  error: null,
  lastFetched: null,
};

// Async thunk to fetch roles (legacy method)
export const fetchRoles = createAsyncThunk(
  'roles/fetchRoles',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await roleService.getRoles(params);
      return response.results;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch roles');
    }
  }
);

// Async thunk to fetch roles with comprehensive filtering (new method)
export const fetchRolesV2 = createAsyncThunk(
  'roles/fetchRolesV2',
  async (params: RoleListRequest = {}, { rejectWithValue }) => {
    console.log('🚀 Fetching roles with params:', params);
    try {
      const response: RoleListResponseV2[] = await roleService.getRolesV2(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch roles');
    }
  }
);

// Async thunk to create a role
export const createRole = createAsyncThunk(
  'roles/createRole',
  async (roleData: any, { rejectWithValue }) => {
    try {
      const response = await roleService.createRole(roleData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to create role');
    }
  }
);

// Async thunk to update a role
export const updateRole = createAsyncThunk(
  'roles/updateRole',
  async ({ id, roleData }: { id: string; roleData: any }, { rejectWithValue }) => {
    try {
      const response = await roleService.updateRole(id, roleData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to update role');
    }
  }
);

// Async thunk to delete a role
export const deleteRole = createAsyncThunk(
  'roles/deleteRole',
  async (id: string, { rejectWithValue }) => {
    try {
      const result = await roleService.deleteRole(id);
      if (result.success) {
        return id;
      } else {
        return rejectWithValue(result.message || 'Failed to delete role');
      }
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to delete role');
    }
  }
);

const roleSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    clearRoles: (state) => {
      state.roles = [];
      state.rolesV2 = [];
      state.lastFetched = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch roles (legacy)
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        
        // Check if the response includes privilege data
        if (action.payload && action.payload.length > 0 && 'privileges' in action.payload[0]) {
          // Store in rolesWithPrivileges if privilege data is included
          state.rolesWithPrivileges = action.payload as RoleResponseWithPrivileges[];
          // Also store in regular roles for backward compatibility
          state.roles = action.payload.map(role => ({
            id: role.id,
            role_name: role.role_name,
            role_description: role.role_description,
            privilege_names: role.privilege_names,
            created_on: role.created_on,
            modified_on: role.modified_on,
            is_active: role.is_active,
            created_by: role.created_by,
            modified_by: role.modified_by
          }));
        } else {
          // Store in regular roles if no privilege data
          state.roles = action.payload;
          // Clear rolesWithPrivileges
          state.rolesWithPrivileges = [];
        }
        
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch roles V2 (new comprehensive method)
    builder
      .addCase(fetchRolesV2.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRolesV2.fulfilled, (state, action) => {
        state.loading = false;
        state.rolesV2 = action.payload;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchRolesV2.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create role
    builder
      .addCase(createRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.loading = false;
        state.roles.push(action.payload);
        state.error = null;
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update role
    builder
      .addCase(updateRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.roles.findIndex(role => role.id === action.payload.id);
        if (index !== -1) {
          state.roles[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete role
    builder
      .addCase(deleteRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = state.roles.filter(role => role.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearRoles, clearError } = roleSlice.actions;

// Selectors
export const selectRoles = (state: { roles: RoleState }) => state.roles.roles;
export const selectRolesV2 = (state: { roles: RoleState }) => state.roles.rolesV2;
export const selectRolesWithPrivileges = (state: { roles: RoleState }) => state.roles.rolesWithPrivileges;
export const selectRolesLoading = (state: { roles: RoleState }) => state.roles.loading;
export const selectRolesError = (state: { roles: RoleState }) => state.roles.error;
export const selectRolesLastFetched = (state: { roles: RoleState }) => state.roles.lastFetched;

export default roleSlice.reducer;
