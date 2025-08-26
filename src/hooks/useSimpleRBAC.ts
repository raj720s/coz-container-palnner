import { useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '@/context/AuthContext';
import { 
  setRBACUser,
  selectRBACUser,
  selectUserPrivileges,
  selectUserRole,
  selectIsSuperUser,
  clearError
} from '@/store/slices/userInfoSlice';
import { RBACUser } from '@/store/slices/userInfoSlice';

/**
 * Simplified RBAC Hook - All RBAC functionality in one place
 * This replaces useEnhancedRBAC, useRoutePermission, useActionPermission
 */
export const useSimpleRBAC = () => {
  const dispatch = useDispatch();
  const { user: authUser, isAuthenticated, logout } = useAuth();
  
  const rbacUserData = useSelector(selectRBACUser);
  const userPrivileges = useSelector(selectUserPrivileges);
  const userRole = useSelector(selectUserRole);
  const isSuperUser = useSelector(selectIsSuperUser);

  // Initialize RBAC from session storage when user is authenticated
  useEffect(() => {
    if (isAuthenticated && authUser?.id && !rbacUserData.data) {
      const storedRBACUser = sessionStorage.getItem("rbac_user");
      if (storedRBACUser) {
        try {
          const rbacUser: RBACUser = JSON.parse(storedRBACUser);
          dispatch(setRBACUser(rbacUser));
          console.log('🔐 RBAC initialized for user:', rbacUser.email);
        } catch (error) {
          console.error('Failed to initialize RBAC:', error);
        }
      }
    }
  }, [isAuthenticated, authUser?.id, rbacUserData.data, dispatch]);

  // Memoized permission functions
  const permissions = useMemo(() => {
    const privileges = userPrivileges || [];

    return {
      /**
       * Check if user has a specific privilege
       */
      hasPrivilege: (privilege: string): boolean => {
        if (isSuperUser) return true; // Superusers have all privileges
        return privileges.includes(privilege);
      },

      /**
       * Check if user has any of the required privileges
       */
      hasAnyPrivilege: (requiredPrivileges: string[]): boolean => {
        if (isSuperUser) return true;
        return requiredPrivileges.some(privilege => privileges.includes(privilege));
      },

      /**
       * Check if user has all required privileges
       */
      hasAllPrivileges: (requiredPrivileges: string[]): boolean => {
        if (isSuperUser) return true;
        return requiredPrivileges.every(privilege => privileges.includes(privilege));
      },

      /**
       * Check if user can access a specific route
       */
      canAccessRoute: (route: string): boolean => {
        if (isSuperUser) return true;
        // Simple route-based access control
        const routePrivileges: Record<string, string[]> = {
          '/admin/dashboard': ['VIEW_ADMIN_DASHBOARD'],
          '/admin/user-management': ['VIEW_USER_LIST'],
          '/admin/role-management': ['VIEW_ROLE_LIST'],
          '/admin/container-types': ['VIEW_CONTAINER_TYPES'],
          '/admin/container-priority': ['VIEW_CONTAINER_PRIORITY'],
          '/admin/container-thresholds': ['VIEW_CONTAINER_THRESHOLDS'],
          '/admin/port-customer-master': ['VIEW_PORT_CUSTOMER_MASTER'],
          '/user/dashboard': ['VIEW_USER_DASHBOARD'],
          '/user/container-planning': ['VIEW_CONTAINER_PLANNING'],
        };
        
        const requiredPrivileges = routePrivileges[route] || [];
        return requiredPrivileges.length === 0 || permissions.hasAnyPrivilege(requiredPrivileges);
      },

      /**
       * Check if user can perform a specific action
       */
      canPerformAction: (action: string, module?: string): boolean => {
        if (isSuperUser) return true;
        
        // Action-based permission mapping
        const actionPrivileges: Record<string, string[]> = {
          'create_role': ['CREATE_ROLE'],
          'update_role': ['UPDATE_ROLE'],
          'delete_role': ['DELETE_ROLE'],
          'view_role': ['VIEW_ROLE'],
          'create_user': ['CREATE_USER'],
          'update_user': ['UPDATE_USER'],
          'delete_user': ['DELETE_USER'],
          'view_user': ['VIEW_USER'],
          'create_priority': ['CREATE_PRIORITY'],
          'update_priority': ['UPDATE_PRIORITY'],
          'delete_priority': ['DELETE_PRIORITY'],
          'view_priority': ['VIEW_CONTAINER_PRIORITY'],
          'create_threshold': ['CREATE_THRESHOLD'],
          'update_threshold': ['UPDATE_THRESHOLD'],
          'delete_threshold': ['DELETE_THRESHOLD'],
          'view_threshold': ['VIEW_CONTAINER_THRESHOLDS'],
          'export_data': ['EXPORT_DATA'],
          'import_data': ['IMPORT_DATA'],
        };
        
        const requiredPrivileges = actionPrivileges[action] || [];
        return requiredPrivileges.length === 0 || permissions.hasAnyPrivilege(requiredPrivileges);
      }
    };
  }, [userPrivileges, isSuperUser]);

  // Role-based functions
  const roles = useMemo(() => ({
    getUserRole: (): number => userRole || 0,
    getRoleName: (): string => {
      if (isSuperUser) return 'Superuser';
      switch (userRole) {
        case 1: return 'Admin';
        case 2: return 'Manager';
        default: return 'User';
      }
    },
    isAdmin: (): boolean => userRole === 1 || isSuperUser,
    isManager: (): boolean => userRole === 2 || isSuperUser,
    isUser: (): boolean => userRole === 0 && !isSuperUser,
    isSuperUser: (): boolean => isSuperUser,
  }), [userRole, isSuperUser]);

  // Utility functions
  const utils = useMemo(() => ({
    clearRBACError: () => dispatch(clearError()),
    getUserPrivileges: () => userPrivileges || [],
    getRBACUser: () => rbacUserData.data,
  }), [userPrivileges, rbacUserData.data, dispatch]);

  return {
    // User data
    user: rbacUserData.data,
    userPrivileges: userPrivileges || [],
    userRole: userRole || 0,
    
    // Permission functions
    hasPrivilege: permissions.hasPrivilege,
    hasAnyPrivilege: permissions.hasAnyPrivilege,
    hasAllPrivileges: permissions.hasAllPrivileges,
    canAccessRoute: permissions.canAccessRoute,
    canPerformAction: permissions.canPerformAction,
    
    // Role functions
    getUserRole: roles.getUserRole,
    getRoleName: roles.getRoleName,
    isAdmin: roles.isAdmin,
    isManager: roles.isManager,
    isUser: roles.isUser,
    isSuperUser: roles.isSuperUser,
    
    // Utility functions
    clearRBACError: utils.clearRBACError,
    getUserPrivileges: utils.getUserPrivileges,
    getRBACUser: utils.getRBACUser,
    
    // State
    loading: rbacUserData.loading,
    error: rbacUserData.error,
    isInitialized: !!rbacUserData.data,
  };
};

export default useSimpleRBAC;
