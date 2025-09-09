"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { selectUser, selectIsAuthenticated } from '@/store/slices/consolidatedUserSlice';
import { simplifiedRBACService, SimplifiedUser } from '@/services/simplifiedRBACService';
import { staticModuleDefinitions } from '@/config/staticModules';

// Simplified privilege interface
export interface SimplifiedPrivilege {
  id: number;
  name: string;
}

// Powerful auth hook interface
export interface SimplifiedAuthContext {
  user: SimplifiedUser | null;
  userRole: number | undefined;
  permissions: string[];
  routes: string[];
  modules: number[];
  can: (action: string) => boolean;
  canVisit: (route: string) => boolean;
  canAccessModule: (moduleId: number) => boolean;
  canAccessAnyModule: (moduleIds: number[]) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string | string[]) => boolean;
  isAdmin: () => boolean;
  isSuperUser: boolean;
  canAccessCustomer: (customerId: number) => boolean;
  getAssignedCustomers: () => number[];
  assignCustomersToUser: (customerIds: number[]) => void;
  removeCustomersFromUser: (customerIds: number[]) => void;
  loading: boolean;
  error: string | null;
}

// Role names mapping
const ROLE_NAMES: Record<number, string> = {
  1: "Admin",
  2: "Manager", 
  3: "Regular User",
  11: "Agent"
};

// Local storage keys
const STORAGE_KEYS = {
  USER_CUSTOMER_ASSIGNMENTS: 'user_customer_assignments',
  CUSTOMERS: 'customers_data',
  USER_ASSIGNMENTS: 'user_assignments'
};

// Main powerful auth hook
export const useSimplifiedAuth = (): SimplifiedAuthContext => {
  const authUser = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [user, setUser] = useState<SimplifiedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize user data from auth and modules
  useEffect(() => {
    const initializeUser = async () => {
      try {
        console.log('🔍 useSimplifiedRBAC: Initializing user', { isAuthenticated, authUser, role_id: authUser?.role_id, privileges: authUser?.privileges, modules: authUser?.modules });
        
        if (!isAuthenticated || !authUser) {
          console.log('🔍 useSimplifiedRBAC: No auth or user, setting user to null');
          setUser(null);
          setLoading(false);
          return;
        }

        // Additional safety check
        if (!authUser.id || !authUser.email) {
          console.warn('🔍 useSimplifiedRBAC: Invalid user data, skipping initialization', { authUser });
          setUser(null);
          setLoading(false);
          return;
        }

        // Check if user is already initialized to prevent duplicate calls
        if (user && user.id === authUser.id?.toString()) {
          console.log('🔍 useSimplifiedRBAC: User already initialized, skipping');
          setLoading(false);
          return;
        }

        // Check if this is a mock user (admin@company.com or user@company.com)
        const isMockUser = authUser.email === 'admin@company.com' || authUser.email === 'user@company.com';
        
        // Check if this is a superuser
        const isSuperUser = authUser.is_superuser || false;
        
        // Get user's assigned customers from local storage
        const assignedCustomers = getAssignedCustomersFromStorage(authUser?.id || '0');
        
        let rolePrivileges: string[] = [];
        let accessibleRoutes: string[] = [];
        let accessibleModules: number[] = [];
        
        console.log('🔍 useSimplifiedRBAC: Starting user processing', {
          isSuperUser,
          hasPrivileges: !!authUser.privileges,
          privilegesLength: authUser.privileges?.length,
          hasModules: !!authUser.modules,
          modulesLength: authUser.modules?.length,
          modules: authUser.modules,
          isMockUser: isMockUser,
          authUserEmail: authUser.email,
          authUserRoleId: authUser.role_id,
          fullAuthUser: authUser
        });
        
        // Handle superuser - give full access to everything
        if (isSuperUser) {
          console.log('🔍 useSimplifiedRBAC: Superuser detected, granting full access', {
            email: authUser.email,
            is_superuser: authUser.is_superuser
          });
          // Get all privileges from static module definitions
          Object.values(staticModuleDefinitions.modules).forEach(module => {
            console.log('🔍 Processing module for superuser:', module);
            accessibleModules.push(module.id);
            accessibleRoutes.push(...(module.routes || []));
            rolePrivileges.push(...(module.privileges || []));
          });
          // Remove duplicates
          accessibleRoutes = [...new Set(accessibleRoutes)];
          rolePrivileges = [...new Set(rolePrivileges)];

          console.log('🔍 Superuser Privileges:', {
            accessibleModules,
            accessibleRoutes,
            rolePrivileges
          });
        }
        // Check if Redux user already has privileges and modules
        else if (authUser.privileges && authUser.privileges.length > 0) {
          console.log('🔍 useSimplifiedRBAC: Redux user has privileges, processing...', {
            hasPrivileges: !!authUser.privileges,
            privilegesLength: authUser.privileges?.length,
            hasModules: !!authUser.modules,
            modulesLength: authUser.modules?.length,
            modules: authUser.modules,
            authUserKeys: Object.keys(authUser)
          });
          console.log('🔍 useSimplifiedRBAC: Using privileges from Redux state', { 
            privileges: authUser.privileges, 
            modules: authUser.modules,
            rawModules: authUser.modules
          });
          rolePrivileges = authUser.privileges;
          accessibleModules = authUser.modules?.map((m: string) => parseInt(m)) || [];
          
          // If no modules from Redux, derive them from privileges
          if (accessibleModules.length === 0) {
            console.log('🔍 useSimplifiedRBAC: No modules from Redux, deriving from privileges...');
            const derivedModules = new Set<number>();
            
            // Find modules that contain the user's privileges
            Object.values(staticModuleDefinitions.modules).forEach(module => {
              const hasMatchingPrivileges = module.privileges.some(privilege => 
                authUser.privileges.includes(privilege)
              );
              if (hasMatchingPrivileges) {
                derivedModules.add(module.id);
                console.log(`🔍 Derived module ${module.id} (${module.name}) from privileges`);
              }
            });
            
            accessibleModules = Array.from(derivedModules);
            console.log('🔍 useSimplifiedRBAC: Derived modules from privileges:', accessibleModules);
          }
          
          console.log('🔍 useSimplifiedRBAC: Processing modules for routes', {
            accessibleModules,
            staticModuleDefinitions: Object.keys(staticModuleDefinitions.modules).map(id => ({
              id: parseInt(id),
              name: staticModuleDefinitions.modules[parseInt(id)].name
            }))
          });
          
          // Get routes from static module definitions
          accessibleModules.forEach(moduleId => {
            const staticModule = staticModuleDefinitions.modules[moduleId];
            console.log(`🔍 Processing module ${moduleId}:`, {
              staticModule,
              routes: staticModule?.routes || []
            });
            if (staticModule) {
              accessibleRoutes.push(...staticModule.routes);
            } else {
              console.warn(`🔍 Module ${moduleId} not found in static definitions`);
            }
          });
          accessibleRoutes = [...new Set(accessibleRoutes)]; // Remove duplicates
          
          console.log('🔍 useSimplifiedRBAC: Final accessible routes', {
            accessibleRoutes,
            totalRoutes: accessibleRoutes.length
          });
        } else if (isMockUser) {
          console.log('🔍 useSimplifiedRBAC: Processing mock user');
          // For mock users, use static data from the user object
          rolePrivileges = authUser.privileges || [];
          accessibleModules = authUser.module_access || [];
          
          // Get routes from static module definitions
          accessibleModules.forEach(moduleId => {
            const staticModule = staticModuleDefinitions.modules[moduleId];
            if (staticModule) {
              accessibleRoutes.push(...staticModule.routes);
            }
          });
          accessibleRoutes = [...new Set(accessibleRoutes)]; // Remove duplicates
        } else {
          console.log('🔍 useSimplifiedRBAC: Processing API user - fetching from server');
          console.log('🔍 useSimplifiedRBAC: This should NOT happen for Redux users with privileges!');
          // For API users, get data from server
          console.log('🔍 useSimplifiedRBAC: Fetching role data from server for role_id:', authUser.role_id);
          const roleData = await simplifiedRBACService.getRoleData(authUser.role_id || 1);
          console.log('🔍 useSimplifiedRBAC: Server role data received:', {
            privileges: roleData.privileges,
            modules: roleData.modules,
            routes: roleData.routes,
            modulePrivilegeMap: roleData.modulePrivilegeMap
          });
          rolePrivileges = roleData.privileges;
          accessibleRoutes = roleData.routes;
          accessibleModules = roleData.modules;
        }

        console.log('🔍 useSimplifiedRBAC: Final processing values', {
          rolePrivileges,
          accessibleRoutes,
          accessibleModules,
          totalPrivileges: rolePrivileges.length,
          totalRoutes: accessibleRoutes.length,
          totalModules: accessibleModules.length
        });

        const simplifiedUser: SimplifiedUser = {
          id: authUser.id?.toString() || '0',
          email: authUser.email || '',
          first_name: authUser.name ? authUser.name.split(' ')[0] : authUser.first_name || 'User',
          last_name: authUser.name ? authUser.name.split(' ').slice(1).join(' ') : authUser.last_name || '',
          role: authUser.role_id || 1,
          role_name: ROLE_NAMES[authUser.role_id || 1] || 'Unknown',
          is_superuser: authUser.is_superuser || false,
          privileges: rolePrivileges,
          accessible_routes: accessibleRoutes,
          module_access: accessibleModules,
          assigned_customers: assignedCustomers
        };

        console.log('🔍 useSimplifiedRBAC: Created simplified user', { 
          simplifiedUser: {
            id: simplifiedUser.id,
            email: simplifiedUser.email,
            role: simplifiedUser.role,
            role_name: simplifiedUser.role_name,
            is_superuser: simplifiedUser.is_superuser,
            privileges: simplifiedUser.privileges,
            accessible_routes: simplifiedUser.accessible_routes,
            module_access: simplifiedUser.module_access,
            assigned_customers: simplifiedUser.assigned_customers
          },
          authUser: {
            id: authUser.id,
            email: authUser.email,
            role_id: authUser.role_id,
            privileges: authUser.privileges,
            modules: authUser.modules
          },
          role: simplifiedUser.role, 
          role_id: authUser.role_id 
        });
        setUser(simplifiedUser);
        setError(null);
      } catch (err) {
        console.error('Error initializing simplified RBAC:', err);
        setError('Failed to initialize user permissions');
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [authUser?.id, authUser?.role_id, isAuthenticated]);

  // Powerful RBAC helper functions
  const can = useCallback((action: string): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    return user.privileges.includes(action);
  }, [user]);

  const canVisit = useCallback((route: string): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    return user.accessible_routes.includes(route);
  }, [user]);

  const canAccessModule = useCallback((moduleId: number): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    return user.module_access.includes(moduleId);
  }, [user]);

  const canAccessAnyModule = useCallback((moduleIds: number[]): boolean => {
    if (!user) {
      console.log('🔍 canAccessAnyModule: No user, returning false');
      return false;
    }
    if (user.is_superuser) {
      console.log('🔍 canAccessAnyModule: Superuser, returning true');
      return true;
    }
    const result = moduleIds.some(moduleId => user.module_access.includes(moduleId));
    console.log('🔍 canAccessAnyModule: Checking modules', {
      requiredModules: moduleIds,
      userModules: user.module_access,
      result
    });
    return result;
  }, [user]);

  const hasRole = useCallback((role: string): boolean => {
    if (!user) return false;
    return user.role_name.toLowerCase() === role.toLowerCase();
  }, [user]);

  const hasAnyRole = useCallback((roles: string | string[]): boolean => {
    if (!user) return false;
    
    // If user is a superuser, always return true
    if (user.is_superuser) {
      console.log('🔍 hasAnyRole: Superuser detected, granting access');
      return true;
    }

    // Normalize roles to an array
    const roleArray = Array.isArray(roles) ? roles : [roles];

    // Check if user's role matches any of the provided roles
    const result = roleArray.some(role => 
      user.role_name.toLowerCase() === role.toLowerCase()
    );

    console.log('🔍 hasAnyRole: Checking roles', { 
      userRole: user.role_name, 
      roles: roleArray, 
      result 
    });

    return result;
  }, [user]);

  const isAdmin = useCallback((): boolean => {
    return user?.role === 1 || user?.is_superuser || false;
  }, [user]);

  const canAccessCustomer = useCallback((customerId: number): boolean => {
    if (!user) return false;
    if (user.is_superuser || isAdmin()) return true;
    return user.assigned_customers.includes(customerId);
  }, [user, isAdmin]);

  const getAssignedCustomers = useCallback((): number[] => {
    return user?.assigned_customers || [];
  }, [user]);

  // Local storage helper functions
  const getAssignedCustomersFromStorage = (userId: string): number[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_CUSTOMER_ASSIGNMENTS);
      if (stored) {
        const assignments = JSON.parse(stored);
        return assignments[userId] || [];
      }
    } catch (error) {
      console.error('Error reading user customer assignments from storage:', error);
    }
    return [];
  };

  const saveAssignedCustomersToStorage = (userId: string, customerIds: number[]) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_CUSTOMER_ASSIGNMENTS);
      const assignments = stored ? JSON.parse(stored) : {};
      assignments[userId] = customerIds;
      localStorage.setItem(STORAGE_KEYS.USER_CUSTOMER_ASSIGNMENTS, JSON.stringify(assignments));
    } catch (error) {
      console.error('Error saving user customer assignments to storage:', error);
    }
  };

  const assignCustomersToUser = useCallback((customerIds: number[]) => {
    if (!user) return;
    
    const currentAssignments = user.assigned_customers;
    const newAssignments = [...new Set([...currentAssignments, ...customerIds])];
    
    // Update local storage
    saveAssignedCustomersToStorage(user.id, newAssignments);
    
    // Update user state
    setUser(prev => prev ? { ...prev, assigned_customers: newAssignments } : null);
  }, [user]);

  const removeCustomersFromUser = useCallback((customerIds: number[]) => {
    if (!user) return;
    
    const newAssignments = user.assigned_customers.filter(id => !customerIds.includes(id));
    
    // Update local storage
    saveAssignedCustomersToStorage(user.id, newAssignments);
    
    // Update user state
    setUser(prev => prev ? { ...prev, assigned_customers: newAssignments } : null);
  }, [user]);

  const contextValue = useMemo(() => {
    const value = {
      user,
      userRole: user?.role,
      permissions: user?.privileges || [],
      routes: user?.accessible_routes || [],
      modules: user?.module_access || [],
      can,
      canVisit,
      canAccessModule,
      canAccessAnyModule,
      hasRole,
      hasAnyRole,
      isAdmin,
      isSuperUser: user?.is_superuser || false,
      canAccessCustomer,
      getAssignedCustomers,
      assignCustomersToUser,
      removeCustomersFromUser,
      loading,
      error
    };
    console.log('🔍 useSimplifiedRBAC: Context value', { userRole: value.userRole, role: user?.role, user: user?.id });
    return value;
  }, [
    user,
    can,
    canVisit,
    canAccessModule,
    canAccessAnyModule,
    hasRole,
    hasAnyRole,
    isAdmin,
    canAccessCustomer,
    getAssignedCustomers,
    assignCustomersToUser,
    removeCustomersFromUser,
    loading,
    error
  ]);

  return contextValue;
};

// Legacy hook for backward compatibility
export const useSimplifiedRBAC = (): SimplifiedAuthContext => {
  return useSimplifiedAuth();
};

// Export static data for use in other components
export { ROLE_NAMES, STORAGE_KEYS };