import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  hasPrivilege, 
  hasAnyPrivilege, 
  hasAllPrivileges, 
  canAccessRoute, 
  canAccessModule,
  getAccessibleRoutes,
  getRolePermissions,
  getAllModules,
  getModuleInfo,
  filterMenuByPermissions,
  type UserPermissions,
  type ModuleInfo
} from '@/utils/rbacUtils';

/**
 * Hook for role-based access control
 */
export const useRBAC = () => {
  const { user, loading } = useAuth();

  // Return early if still loading or no user
  if (loading || !user) {
    return {
      user: null,
      userRole: 0,
      userPrivileges: [],
      hasPrivilege: () => false,
      hasAnyPrivilege: () => false,
      hasAllPrivileges: () => false,
      canAccessRoute: () => false,
      canAccessModule: () => false,
      getAccessibleRoutes: () => [],
      getRolePermissions: () => ({ modules: [], privileges: [] }),
      filterMenu: () => [],
      isAdmin: () => false,
      isManager: () => false,
      isUser: () => false
    };
  }

  // Map string roles to numeric roles for RBAC compatibility
  const userRole = user?.role === 'admin' ? 1 : 0;
  
  // Extract privileges from accessControl array and convert to privilege format
  const userPrivileges = user?.accessControl?.map((route: string) => {
    // Convert route-based access control to privilege format
    if (route.includes('user-management')) return 'VIEW_USER_LIST';
    if (route.includes('role-management')) return 'VIEW_ROLE_LIST';
    if (route.includes('container-types')) return 'VIEW_CONTAINER_TYPES';
    if (route.includes('container-thresholds')) return 'VIEW_CONTAINER_THRESHOLDS';
    if (route.includes('container-priority')) return 'VIEW_CONTAINER_PRIORITY';
    if (route.includes('container-planning')) return 'VIEW_CONTAINER_PLANNING';
    if (route.includes('port-customer-master')) return 'VIEW_PORT_CUSTOMER_MASTER';
    if (route.includes('shipment-upload')) return 'VIEW_SHIPMENT_UPLOAD';
    if (route.includes('assignment-results')) return 'VIEW_ASSIGNMENT_RESULTS';
    if (route.includes('validation-summary')) return 'VIEW_VALIDATION_SUMMARY';
    if (route.includes('repositioning-summary')) return 'VIEW_REPOSITIONING_SUMMARY';
    if (route.includes('data-backup')) return 'VIEW_DATA_BACKUP';
    if (route.includes('system-settings')) return 'VIEW_SYSTEM_SETTINGS';
    if (route.includes('test-validation')) return 'VIEW_TEST_VALIDATION';
    if (route.includes('shipment-operations')) return 'VIEW_SHIPMENT_OPERATIONS';
    if (route.includes('dashboard')) return 'VIEW_DASHBOARD';
    
    // Default privilege for any route
    return `VIEW_${route.replace(/[^a-zA-Z]/g, '_').toUpperCase()}`;
  }) || [];

  // Memoized permission functions
  const permissions = useMemo(() => ({
    /**
     * Check if user has a specific privilege
     */
    hasPrivilege: (privilege: string): boolean => {
      return hasPrivilege(userPrivileges, privilege);
    },

    /**
     * Check if user has any of the required privileges
     */
    hasAnyPrivilege: (privileges: string[]): boolean => {
      return hasAnyPrivilege(userPrivileges, privileges);
    },

    /**
     * Check if user has all required privileges
     */
    hasAllPrivileges: (privileges: string[]): boolean => {
      return hasAllPrivileges(userPrivileges, privileges);
    },

    /**
     * Check if user can access a specific route
     */
    canAccessRoute: (route: string): boolean => {
      return canAccessRoute(userRole, userPrivileges, route);
    },

    /**
     * Check if user can access a specific module
     */
    canAccessModule: (moduleId: string): boolean => {
      return canAccessModule(userRole, moduleId);
    },

    /**
     * Get all routes user can access
     */
    getAccessibleRoutes: (): string[] => {
      return getAccessibleRoutes(userRole, userPrivileges);
    },

    /**
     * Get role-based permissions
     */
    getRolePermissions: () => {
      return getRolePermissions(userRole);
    },

    /**
     * Filter menu items based on permissions
     */
    filterMenu: (menuItems: any[]): any[] => {
      return filterMenuByPermissions(menuItems, userRole, userPrivileges);
    },

    /**
     * Check if user is admin
     */
    isAdmin: (): boolean => {
      return userRole === 1;
    },

    /**
     * Check if user is manager (currently same as admin)
     */
    isManager: (): boolean => {
      return userRole === 1; // Manager role not implemented yet, treat as admin
    },

    /**
     * Check if user is regular user
     */
    isUser: (): boolean => {
      return userRole === 0;
    }
  }), [userRole, userPrivileges]);

  return {
    user,
    userRole,
    userPrivileges,
    ...permissions
  };
};

/**
 * Hook for module information
 */
export const useModules = () => {
  const { userRole } = useRBAC();

  const modules = useMemo(() => {
    const allModules = getAllModules();
    
    // Filter modules based on user role
    return allModules.filter(module => canAccessModule(userRole, module.id));
  }, [userRole]);

  return {
    modules,
    getAllModules,
    getModuleInfo
  };
};

/**
 * Hook for privilege checking with specific privileges
 */
export const usePrivileges = (requiredPrivileges: string[] = []) => {
  const { hasPrivilege, hasAnyPrivilege, hasAllPrivileges, userPrivileges } = useRBAC();

  const privilegeChecks = useMemo(() => ({
    hasRequired: requiredPrivileges.length === 0 ? true : hasAnyPrivilege(requiredPrivileges),
    hasAll: requiredPrivileges.length === 0 ? true : hasAllPrivileges(requiredPrivileges),
    missing: requiredPrivileges.filter(privilege => !hasPrivilege(privilege))
  }), [hasPrivilege, hasAnyPrivilege, hasAllPrivileges, requiredPrivileges]);

  return {
    ...privilegeChecks,
    userPrivileges,
    hasPrivilege
  };
};

/**
 * Hook for route access checking
 */
export const useRouteAccess = (route?: string) => {
  const { canAccessRoute, getAccessibleRoutes } = useRBAC();
  
  const routeAccess = useMemo(() => {
    if (!route) return { canAccess: true, accessibleRoutes: getAccessibleRoutes() };
    
    return {
      canAccess: canAccessRoute(route),
      accessibleRoutes: getAccessibleRoutes()
    };
  }, [route, canAccessRoute, getAccessibleRoutes]);

  return routeAccess;
};
