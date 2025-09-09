import { useDispatch, useSelector, useStore } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppStore = () => useStore<RootState>();

// Custom hooks for common use cases

// Auth hooks
export const useAuth = () => {
  return useAppSelector((state) => state.user);
};

export const useUser = () => {
  return useAppSelector((state) => state.user.user);
};

export const useIsAuthenticated = () => {
  return useAppSelector((state) => state.user.isAuthenticated);
};

// UI hooks
export const useTheme = () => {
  const theme = useAppSelector((state) => state.ui.theme);
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  return { theme, isDarkMode };
};

export const useSidebar = () => {
  const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  return { sidebarCollapsed, sidebarOpen };
};

export const useNotifications = () => {
  const notifications = useAppSelector((state) => state.ui.notifications);
  const unreadCount = notifications.filter(n => !n.read).length;
  return { notifications, unreadCount };
};

export const useModal = (modalId: string) => {
  return useAppSelector((state) => state.ui.modals[modalId] || { isOpen: false, data: undefined });
};

export const useGlobalLoading = () => {
  return useAppSelector((state) => ({
    isLoading: state.ui.globalLoading,
    message: state.ui.loadingMessage,
  }));
};

// User management hooks
export const useUsers = () => {
  return useAppSelector((state) => state.users);
};

export const useUserPagination = () => {
  return useAppSelector((state) => ({
    currentPage: state.users.currentPage,
    pageSize: state.users.pageSize,
    totalPages: state.users.totalPages,
    totalUsers: state.users.totalUsers,
  }));
};

export const useUserFilters = () => {
  return useAppSelector((state) => ({
    filters: state.users.filters,
    searchQuery: state.users.searchQuery,
    sortBy: state.users.sortBy,
    sortOrder: state.users.sortOrder,
  }));
};

export const useSelectedUsers = () => {
  return useAppSelector((state) => state.users.selectedUsers);
};

// Role management hooks
export const useRoles = () => {
  return useAppSelector((state) => state.roles);
};

export const useRolePagination = () => {
  return useAppSelector((state) => ({
    currentPage: state.roles.currentPage,
    pageSize: state.roles.pageSize,
    totalPages: state.roles.totalPages,
    totalRoles: state.roles.totalRoles,
  }));
};

export const useRoleFilters = () => {
  return useAppSelector((state) => ({
    filters: state.roles.filters,
    searchQuery: state.roles.searchQuery,
    sortBy: state.roles.sortBy,
    sortOrder: state.roles.sortOrder,
  }));
};

export const useSelectedRoles = () => {
  return useAppSelector((state) => state.roles.selectedRoles);
};

export const usePrivileges = () => {
  return useAppSelector((state) => ({
    privileges: state.roles.privileges,
    loaded: state.roles.privilegesLoaded,
  }));
};
