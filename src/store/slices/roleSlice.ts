import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RoleResponse, RoleListParams, Privilege } from '@/types/api';

interface RoleState {
  // Current role list
  roles: RoleResponse[];
  totalRoles: number;
  
  // Privileges
  privileges: Privilege[];
  privilegesLoaded: boolean;
  
  // Selected roles for bulk operations
  selectedRoles: number[];
  
  // Filters and search
  filters: RoleListParams;
  searchQuery: string;
  
  // Pagination
  currentPage: number;
  pageSize: number;
  totalPages: number;
  
  // Sorting
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
  
  // UI states
  isLoading: boolean;
  error: string | null;
  
  // Cache for role details
  roleDetailsCache: Record<number, RoleResponse>;
  
  // Recently viewed roles
  recentlyViewed: number[];
  
  // Role management states
  bulkOperationLoading: boolean;
  lastUpdated: number | null;
  
  // Role statistics
  statistics: {
    totalRoles: number;
    activeRoles: number;
    inactiveRoles: number;
    rolesWithUsers: number;
    averagePrivilegesPerRole: number;
  } | null;
}

const initialState: RoleState = {
  roles: [],
  totalRoles: 0,
  privileges: [],
  privilegesLoaded: false,
  selectedRoles: [],
  filters: {},
  searchQuery: '',
  currentPage: 1,
  pageSize: 20,
  totalPages: 0,
  sortBy: null,
  sortOrder: 'asc',
  isLoading: false,
  error: null,
  roleDetailsCache: {},
  recentlyViewed: [],
  bulkOperationLoading: false,
  lastUpdated: null,
  statistics: null,
};

const roleSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setBulkOperationLoading: (state, action: PayloadAction<boolean>) => {
      state.bulkOperationLoading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Role list management
    setRoles: (state, action: PayloadAction<{ roles: RoleResponse[]; total: number; page: number; totalPages: number }>) => {
      state.roles = action.payload.roles;
      state.totalRoles = action.payload.total;
      state.currentPage = action.payload.page;
      state.totalPages = action.payload.totalPages;
      state.lastUpdated = Date.now();
    },
    
    addRole: (state, action: PayloadAction<RoleResponse>) => {
      state.roles.unshift(action.payload);
      state.totalRoles += 1;
    },
    
    updateRole: (state, action: PayloadAction<RoleResponse>) => {
      const index = state.roles.findIndex(role => role.id === action.payload.id);
      if (index !== -1) {
        state.roles[index] = action.payload;
      }
      // Update cache
      state.roleDetailsCache[action.payload.id] = action.payload;
    },
    
    removeRole: (state, action: PayloadAction<number>) => {
      state.roles = state.roles.filter(role => role.id !== action.payload);
      state.totalRoles -= 1;
      // Remove from cache
      delete state.roleDetailsCache[action.payload];
      // Remove from selected
      state.selectedRoles = state.selectedRoles.filter(id => id !== action.payload);
      // Remove from recently viewed
      state.recentlyViewed = state.recentlyViewed.filter(id => id !== action.payload);
    },
    
    // Privileges management
    setPrivileges: (state, action: PayloadAction<Privilege[]>) => {
      state.privileges = action.payload;
      state.privilegesLoaded = true;
    },
    
    // Selection management
    selectRole: (state, action: PayloadAction<number>) => {
      if (!state.selectedRoles.includes(action.payload)) {
        state.selectedRoles.push(action.payload);
      }
    },
    
    deselectRole: (state, action: PayloadAction<number>) => {
      state.selectedRoles = state.selectedRoles.filter(id => id !== action.payload);
    },
    
    selectAllRoles: (state) => {
      state.selectedRoles = state.roles.map(role => role.id);
    },
    
    clearSelection: (state) => {
      state.selectedRoles = [];
    },
    
    toggleRoleSelection: (state, action: PayloadAction<number>) => {
      const roleId = action.payload;
      if (state.selectedRoles.includes(roleId)) {
        state.selectedRoles = state.selectedRoles.filter(id => id !== roleId);
      } else {
        state.selectedRoles.push(roleId);
      }
    },
    
    // Filters and search
    setFilters: (state, action: PayloadAction<RoleListParams>) => {
      state.filters = action.payload;
      state.currentPage = 1; // Reset to first page when filters change
    },
    
    updateFilter: (state, action: PayloadAction<{ key: keyof RoleListParams; value: any }>) => {
      state.filters[action.payload.key] = action.payload.value;
      state.currentPage = 1; // Reset to first page
    },
    
    clearFilters: (state) => {
      state.filters = {};
      state.currentPage = 1;
    },
    
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.currentPage = 1; // Reset to first page when search changes
    },
    
    clearSearch: (state) => {
      state.searchQuery = '';
      state.currentPage = 1;
    },
    
    // Pagination
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.currentPage = 1; // Reset to first page when page size changes
    },
    
    // Sorting
    setSorting: (state, action: PayloadAction<{ sortBy: string; sortOrder: 'asc' | 'desc' }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
      state.currentPage = 1; // Reset to first page when sorting changes
    },
    
    clearSorting: (state) => {
      state.sortBy = null;
      state.sortOrder = 'asc';
    },
    
    // Cache management
    cacheRoleDetails: (state, action: PayloadAction<RoleResponse>) => {
      state.roleDetailsCache[action.payload.id] = action.payload;
    },
    
    removeCachedRoleDetails: (state, action: PayloadAction<number>) => {
      delete state.roleDetailsCache[action.payload];
    },
    
    clearCache: (state) => {
      state.roleDetailsCache = {};
    },
    
    // Recently viewed
    addToRecentlyViewed: (state, action: PayloadAction<number>) => {
      const roleId = action.payload;
      // Remove if already exists
      state.recentlyViewed = state.recentlyViewed.filter(id => id !== roleId);
      // Add to beginning
      state.recentlyViewed.unshift(roleId);
      // Keep only last 10
      if (state.recentlyViewed.length > 10) {
        state.recentlyViewed = state.recentlyViewed.slice(0, 10);
      }
    },
    
    clearRecentlyViewed: (state) => {
      state.recentlyViewed = [];
    },
    
    // Statistics
    setStatistics: (state, action: PayloadAction<RoleState['statistics']>) => {
      state.statistics = action.payload;
    },
    
    // Reset state
    resetRoleState: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setLoading,
  setBulkOperationLoading,
  setError,
  setRoles,
  addRole,
  updateRole,
  removeRole,
  setPrivileges,
  selectRole,
  deselectRole,
  selectAllRoles,
  clearSelection,
  toggleRoleSelection,
  setFilters,
  updateFilter,
  clearFilters,
  setSearchQuery,
  clearSearch,
  setCurrentPage,
  setPageSize,
  setSorting,
  clearSorting,
  cacheRoleDetails,
  removeCachedRoleDetails,
  clearCache,
  addToRecentlyViewed,
  clearRecentlyViewed,
  setStatistics,
  resetRoleState,
} = roleSlice.actions;

// Selectors
export const selectRoles = (state: { roles: RoleState }) => state.roles;
export const selectRolesList = (state: { roles: RoleState }) => state.roles.roles;
export const selectTotalRoles = (state: { roles: RoleState }) => state.roles.totalRoles;
export const selectPrivileges = (state: { roles: RoleState }) => state.roles.privileges;
export const selectPrivilegesLoaded = (state: { roles: RoleState }) => state.roles.privilegesLoaded;
export const selectSelectedRoles = (state: { roles: RoleState }) => state.roles.selectedRoles;
export const selectRoleFilters = (state: { roles: RoleState }) => state.roles.filters;
export const selectRoleSearchQuery = (state: { roles: RoleState }) => state.roles.searchQuery;
export const selectRolePagination = (state: { roles: RoleState }) => ({
  currentPage: state.roles.currentPage,
  pageSize: state.roles.pageSize,
  totalPages: state.roles.totalPages,
  totalRoles: state.roles.totalRoles,
});
export const selectRoleSorting = (state: { roles: RoleState }) => ({
  sortBy: state.roles.sortBy,
  sortOrder: state.roles.sortOrder,
});
export const selectRoleLoading = (state: { roles: RoleState }) => state.roles.isLoading;
export const selectRoleError = (state: { roles: RoleState }) => state.roles.error;
export const selectRoleDetailsCache = (state: { roles: RoleState }) => state.roles.roleDetailsCache;
export const selectCachedRole = (roleId: number) => (state: { roles: RoleState }) => 
  state.roles.roleDetailsCache[roleId];
export const selectRecentlyViewedRoles = (state: { roles: RoleState }) => state.roles.recentlyViewed;
export const selectBulkOperationLoading = (state: { roles: RoleState }) => state.roles.bulkOperationLoading;
export const selectRoleStatistics = (state: { roles: RoleState }) => state.roles.statistics;

export default roleSlice.reducer;
