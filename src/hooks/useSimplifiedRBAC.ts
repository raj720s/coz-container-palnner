import { useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * Simplified RBAC Hook - Routes and Privileges Only
 * Removes module complexity and focuses on direct route/privilege mapping
 */
export const useSimplifiedRBAC = () => {
  const { user, isAuthenticated } = useAuth();
  
  // Check if user has access to a specific route
  const hasRouteAccess = useCallback((route: string): boolean => {
    if (!isAuthenticated || !user) return false;
    if (user.is_superuser) return true;
    
    // Check if route is in user's accessible routes
    return user.accessible_routes?.includes(route) || false;
  }, [user, isAuthenticated]);
  
  // Check if user has a specific privilege
  const hasPrivilege = useCallback((privilegeName: string): boolean => {
    if (!isAuthenticated || !user) return false;
    if (user.is_superuser) return true;
    
    return user.privileges?.some(p => p.privilege_name === privilegeName) || false;
  }, [user, isAuthenticated]);
  
  // Check if user can perform a specific action
  const hasActionAccess = useCallback((actionName: string): boolean => {
    if (!isAuthenticated || !user) return false;
    if (user.is_superuser) return true;
    
    return user.privileges?.some(p => 
      p.resource_type === 'action' && p.resource_identifier === actionName
    ) || false;
  }, [user, isAuthenticated]);
  
  // Check if user has access to a specific feature
  const hasFeatureAccess = useCallback((featureName: string): boolean => {
    if (!isAuthenticated || !user) return false;
    if (user.is_superuser) return true;
    
    return user.privileges?.some(p => 
      p.resource_type === 'feature' && p.resource_identifier === featureName
    ) || false;
  }, [user, isAuthenticated]);
  
  // Check if user has any of the specified privileges
  const hasAnyPrivilege = useCallback((privilegeNames: string[]): boolean => {
    if (!isAuthenticated || !user) return false;
    if (user.is_superuser) return true;
    
    return privilegeNames.some(privilegeName => hasPrivilege(privilegeName));
  }, [user, isAuthenticated, hasPrivilege]);
  
  // Check if user has all of the specified privileges
  const hasAllPrivileges = useCallback((privilegeNames: string[]): boolean => {
    if (!isAuthenticated || !user) return false;
    if (user.is_superuser) return true;
    
    return privilegeNames.every(privilegeName => hasPrivilege(privilegeName));
  }, [user, isAuthenticated, hasPrivilege]);
  
  // Get all privileges of a specific type
  const getPrivilegesByType = useCallback((resourceType: 'route' | 'action' | 'feature'): string[] => {
    if (!isAuthenticated || !user) return [];
    if (user.is_superuser) return ['*']; // Superuser has all privileges
    
    return user.privileges
      ?.filter(p => p.resource_type === resourceType)
      ?.map(p => p.resource_identifier) || [];
  }, [user, isAuthenticated]);
  
  // Memoized user information
  const userInfo = useMemo(() => ({
    id: user?.id,
    email: user?.email,
    name: user?.name,
    roleId: user?.role_id,
    roleName: user?.role_name,
    isSuperUser: user?.is_superuser || false,
    privileges: user?.privileges || [],
    accessibleRoutes: user?.accessible_routes || []
  }), [user]);
  
  return {
    // Permission checks
    hasRouteAccess,
    hasPrivilege,
    hasActionAccess,
    hasFeatureAccess,
    hasAnyPrivilege,
    hasAllPrivileges,
    
    // Utility functions
    getPrivilegesByType,
    
    // User information
    ...userInfo,
    
    // State
    isAuthenticated,
    loading: false, // Simplified - no loading state needed
    error: null // Simplified - no error state needed
  };
};

export default useSimplifiedRBAC;

