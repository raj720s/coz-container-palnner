import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserDetailResponse, UserListParams } from '@/types/api';

interface UserState {
  // Current user list
  users: UserDetailResponse[];
  totalUsers: number;
  
  // Selected users for bulk operations
  selectedUsers: number[];
  
  // Filters and search
  filters: UserListParams;
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
  
  // Cache for user details
  userDetailsCache: Record<number, UserDetailResponse>;
  
  // Recently viewed users
  recentlyViewed: number[];
  
  // User management states
  bulkOperationLoading: boolean;
  lastUpdated: number | null;
}

const initialState: UserState = {
  users: [],
  totalUsers: 0,
  selectedUsers: [],
  filters: {},
  searchQuery: '',
  currentPage: 1,
  pageSize: 20,
  totalPages: 0,
  sortBy: null,
  sortOrder: 'asc',
  isLoading: false,
  error: null,
  userDetailsCache: {},
  recentlyViewed: [],
  bulkOperationLoading: false,
  lastUpdated: null,
};

const userSlice = createSlice({
  name: 'users',
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
    
    // User list management
    setUsers: (state, action: PayloadAction<{ users: UserDetailResponse[]; total: number; page: number; totalPages: number }>) => {
      state.users = action.payload.users;
      state.totalUsers = action.payload.total;
      state.currentPage = action.payload.page;
      state.totalPages = action.payload.totalPages;
      state.lastUpdated = Date.now();
    },
    
    addUser: (state, action: PayloadAction<UserDetailResponse>) => {
      state.users.unshift(action.payload);
      state.totalUsers += 1;
    },
    
    updateUser: (state, action: PayloadAction<UserDetailResponse>) => {
      const index = state.users.findIndex(user => user.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
      // Update cache
      state.userDetailsCache[action.payload.id] = action.payload;
    },
    
    removeUser: (state, action: PayloadAction<number>) => {
      state.users = state.users.filter(user => user.id !== action.payload);
      state.totalUsers -= 1;
      // Remove from cache
      delete state.userDetailsCache[action.payload];
      // Remove from selected
      state.selectedUsers = state.selectedUsers.filter(id => id !== action.payload);
      // Remove from recently viewed
      state.recentlyViewed = state.recentlyViewed.filter(id => id !== action.payload);
    },
    
    // Selection management
    selectUser: (state, action: PayloadAction<number>) => {
      if (!state.selectedUsers.includes(action.payload)) {
        state.selectedUsers.push(action.payload);
      }
    },
    
    deselectUser: (state, action: PayloadAction<number>) => {
      state.selectedUsers = state.selectedUsers.filter(id => id !== action.payload);
    },
    
    selectAllUsers: (state) => {
      state.selectedUsers = state.users.map(user => user.id);
    },
    
    clearSelection: (state) => {
      state.selectedUsers = [];
    },
    
    toggleUserSelection: (state, action: PayloadAction<number>) => {
      const userId = action.payload;
      if (state.selectedUsers.includes(userId)) {
        state.selectedUsers = state.selectedUsers.filter(id => id !== userId);
      } else {
        state.selectedUsers.push(userId);
      }
    },
    
    // Filters and search
    setFilters: (state, action: PayloadAction<UserListParams>) => {
      state.filters = action.payload;
      state.currentPage = 1; // Reset to first page when filters change
    },
    
    updateFilter: (state, action: PayloadAction<{ key: keyof UserListParams; value: any }>) => {
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
    cacheUserDetails: (state, action: PayloadAction<UserDetailResponse>) => {
      state.userDetailsCache[action.payload.id] = action.payload;
    },
    
    removeCachedUserDetails: (state, action: PayloadAction<number>) => {
      delete state.userDetailsCache[action.payload];
    },
    
    clearCache: (state) => {
      state.userDetailsCache = {};
    },
    
    // Recently viewed
    addToRecentlyViewed: (state, action: PayloadAction<number>) => {
      const userId = action.payload;
      // Remove if already exists
      state.recentlyViewed = state.recentlyViewed.filter(id => id !== userId);
      // Add to beginning
      state.recentlyViewed.unshift(userId);
      // Keep only last 10
      if (state.recentlyViewed.length > 10) {
        state.recentlyViewed = state.recentlyViewed.slice(0, 10);
      }
    },
    
    clearRecentlyViewed: (state) => {
      state.recentlyViewed = [];
    },
    
    // Reset state
    resetUserState: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setLoading,
  setBulkOperationLoading,
  setError,
  setUsers,
  addUser,
  updateUser,
  removeUser,
  selectUser,
  deselectUser,
  selectAllUsers,
  clearSelection,
  toggleUserSelection,
  setFilters,
  updateFilter,
  clearFilters,
  setSearchQuery,
  clearSearch,
  setCurrentPage,
  setPageSize,
  setSorting,
  clearSorting,
  cacheUserDetails,
  removeCachedUserDetails,
  clearCache,
  addToRecentlyViewed,
  clearRecentlyViewed,
  resetUserState,
} = userSlice.actions;

// Selectors
export const selectUsers = (state: { users: UserState }) => state.users;
export const selectUsersList = (state: { users: UserState }) => state.users.users;
export const selectTotalUsers = (state: { users: UserState }) => state.users.totalUsers;
export const selectSelectedUsers = (state: { users: UserState }) => state.users.selectedUsers;
export const selectUserFilters = (state: { users: UserState }) => state.users.filters;
export const selectUserSearchQuery = (state: { users: UserState }) => state.users.searchQuery;
export const selectUserPagination = (state: { users: UserState }) => ({
  currentPage: state.users.currentPage,
  pageSize: state.users.pageSize,
  totalPages: state.users.totalPages,
  totalUsers: state.users.totalUsers,
});
export const selectUserSorting = (state: { users: UserState }) => ({
  sortBy: state.users.sortBy,
  sortOrder: state.users.sortOrder,
});
export const selectUserLoading = (state: { users: UserState }) => state.users.isLoading;
export const selectUserError = (state: { users: UserState }) => state.users.error;
export const selectUserDetailsCache = (state: { users: UserState }) => state.users.userDetailsCache;
export const selectCachedUser = (userId: number) => (state: { users: UserState }) => 
  state.users.userDetailsCache[userId];
export const selectRecentlyViewedUsers = (state: { users: UserState }) => state.users.recentlyViewed;
export const selectBulkOperationLoading = (state: { users: UserState }) => state.users.bulkOperationLoading;

export default userSlice.reducer;
