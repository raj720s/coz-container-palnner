import { useEffect, useMemo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '@/context/AuthContext';
import { selectUser } from '@/store/slices/authSlice';
import staticModuleDefinitions from '@/config/staticModules';

/**
 * Simplified RBAC Hook - All RBAC functionality in one place
 * Now works with static modules and server-provided privileges
 */
export const useSimpleRBAC = () => {
  const { user: authUser, isAuthenticated, logout } = useAuth();
  
  // Use Redux auth state as single source of truth
  const reduxUser = useSelector(selectUser);
  
  // Get user information from Redux auth state
  const userRole = reduxUser?.role_id || 0;
  console.log('🔐 useSimpleRBAC - Redux user state:', {
    userRole,
    isSuperUser: reduxUser?.is_superuser,
    userId: reduxUser?.id,
    email: reduxUser?.email,
    reduxUserData: reduxUser
  });
  const isSuperUser = reduxUser?.is_superuser || false;
  
  // Get privileges from session storage (set by AuthContext)
  const [userPrivileges, setUserPrivileges] = useState<string[]>([]);
  const [privilegesLoaded, setPrivilegesLoaded] = useState(false);
  
  // Initialize privileges from session storage
  useEffect(() => {
    if (isAuthenticated && authUser) {
      const storedUser = sessionStorage.getItem("auth_user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('🔐 Session storage user data:', userData);
          console.log('🔐 Session storage privileges:', userData.privileges);
          console.log('🔐 Redux user data:', reduxUser);
          console.log('🔐 Role comparison - Session:', userData.role_id, 'Redux:', reduxUser?.role_id);
          setUserPrivileges(userData.privileges || []);
          setPrivilegesLoaded(true);
          console.log('🔐 RBAC privileges loaded from session storage:', userData.privileges?.length || 0);
        } catch (error) {
          console.error('Failed to load privileges from session storage:', error);
          setUserPrivileges([]);
          setPrivilegesLoaded(true);
        }
      } else {
        setPrivilegesLoaded(true);
      }
    } else {
      setUserPrivileges([]);
      setPrivilegesLoaded(true);
    }
  }, [isAuthenticated, authUser, reduxUser]);
  
  // Function to clear everything when user is not authenticated
  const clearEverything = useCallback(() => {
    console.log('🚪 useSimpleRBAC: User not authenticated, clearing everything');
    
    // Clear all session storage
    sessionStorage.clear();
    
    // Clear Redux store
    logout();
  }, [logout]);

  // Initialize RBAC from session storage when user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // User is not authenticated, clear everything
      clearEverything();
      return;
    }

    // Check if session storage still has valid data
    const storedToken = sessionStorage.getItem("auth_token");
    const storedUser = sessionStorage.getItem("auth_user");
    
    if (!storedToken || !storedUser) {
      console.log('🚪 useSimpleRBAC: Session storage data missing, clearing everything');
      clearEverything();
      return;
    }

    // No need to initialize RBAC user separately anymore
    console.log('🔐 RBAC using Redux auth state and session storage privileges');
  }, [isAuthenticated, authUser?.id, reduxUser, clearEverything]);

  // Memoized permission functions
  const permissions = useMemo(() => ({
    /**
     * Check if user has a specific privilege
     * Now works with static privileges from AuthContext
     */
    hasPrivilege: (privilegeName: string): boolean => {
      if (!isAuthenticated) return false;
      if (isSuperUser) return true;
      
      // Wait for privileges to be loaded
      if (!privilegesLoaded) {
        console.log(`⏳ Privileges not yet loaded, waiting...`);
        return false;
      }
      
      // Check user privileges (now provided statically from AuthContext)
      if (userPrivileges && userPrivileges.length > 0) {
        const hasPrivilege = userPrivileges.includes(privilegeName);
        console.log(`🔐 Privilege check: ${privilegeName} = ${hasPrivilege ? '✅' : '❌'} (User has: ${userPrivileges.length} privileges)`);
        console.log(`🔐 Available privileges:`, userPrivileges);
        console.log(`🔐 Checking for: ${privilegeName}`);
        return hasPrivilege;
      }
      
      console.log(`⚠️ No privileges available for user, denying: ${privilegeName}`);
      return false;
    },

    /**
     * Check if user has any of the specified privileges
     */
    hasAnyPrivilege: (privilegeNames: string[]): boolean => {
      if (!isAuthenticated) return false;
      if (isSuperUser) return true;
      
      // Wait for privileges to be loaded
      if (!privilegesLoaded) {
        console.log(`⏳ Privileges not yet loaded for ANY check, waiting...`);
        return false;
      }
      
      // Check user privileges (now provided statically from AuthContext)
      if (userPrivileges && userPrivileges.length > 0) {
        const hasAny = privilegeNames.some(privilegeName => 
          userPrivileges.includes(privilegeName)
        );
        console.log(`🔐 Privilege check (ANY): ${privilegeNames.join(', ')} = ${hasAny ? '✅' : '❌'} (User has: ${userPrivileges.length} privileges)`);
        return hasAny;
      }
      
      console.log(`⚠️ No privileges available for ANY check: ${privilegeNames.join(', ')}`);
      return false;
    },

    /**
     * Check if user has all of the specified privileges
     */
    hasAllPrivileges: (privilegeNames: string[]): boolean => {
      if (!isAuthenticated) return false;
      if (isSuperUser) return true;
      
      // Wait for privileges to be loaded
      if (!privilegesLoaded) {
        console.log(`⏳ Privileges not yet loaded for ALL check, waiting...`);
        return false;
      }
      
      // Check user privileges (now provided statically from AuthContext)
      if (userPrivileges && userPrivileges.length > 0) {
        const hasAll = privilegeNames.every(privilegeName => 
          userPrivileges.includes(privilegeName)
        );
        console.log(`🔐 Privilege check (ALL): ${privilegeNames.join(', ')} = ${hasAll ? '✅' : '❌'} (User has: ${userPrivileges.length} privileges)`);
        return hasAll;
      }
      
      console.log(`⚠️ No privileges available for ALL check: ${privilegeNames.join(', ')}`);
      return false;
    },

    /**
     * Check if user can access a specific route
     */
    canAccessRoute: (route: string): boolean => {
      if (!isAuthenticated) return false;
      if (isSuperUser) return true;
      
      // Wait for privileges to be loaded
      if (!privilegesLoaded) {
        console.log(`⏳ Privileges not yet loaded for route check, waiting...`);
        return false;
      }
      
      // Find which module this route belongs to
      const moduleEntry = Object.entries(staticModuleDefinitions.modules).find(([_, module]) => {
        return module.routes.some(moduleRoute => route.startsWith(moduleRoute));
      });

      if (!moduleEntry) {
        // Route not defined in any module, allow access for now
        console.log(`🔐 Route access check: ${route} -> Not in modules, allowing access`);
        return true;
      }

      const [moduleId, module] = moduleEntry;
      
      // Check if user has any privileges for this module
      if (userPrivileges && userPrivileges.length > 0) {
        const hasModuleAccess = userPrivileges.some(privilege => {
          return module.privileges.includes(privilege);
        });
        
        console.log(`🔐 Route access check: ${route} -> Module ${moduleId} = ${hasModuleAccess ? '✅' : '❌'} (User has: ${userPrivileges.length} privileges)`);
        return hasModuleAccess;
      }
      
      console.log(`⚠️ Route access check: ${route} -> Module ${moduleId} = ❌ (no privileges available)`);
      
      // If module has no privileges required, allow access
      if (module.privileges.length === 0) { 
        console.log(`🔐 Route access check: ${route} -> Module ${moduleId} = ✅ (no privileges required)`);
        return true; 
      }

      return false;
    },

    /**
     * Check if user can perform a specific action
     */
    canPerformAction: (actionName: string): boolean => {
      if (!isAuthenticated) return false;
      if (isSuperUser) return true;
      
      // Wait for privileges to be loaded
      if (!privilegesLoaded) {
        console.log(`⏳ Privileges not yet loaded for action check, waiting...`);
        return false;
      }
      
      // Check if user has the specific action privilege
      if (userPrivileges && userPrivileges.length > 0) {
        const hasActionPrivilege = userPrivileges.includes(actionName);
        console.log(`🔐 Action check: ${actionName} = ${hasActionPrivilege ? '✅' : '❌'} (User has: ${userPrivileges.length} privileges)`);
        return hasActionPrivilege;
      }
      
      console.log(`⚠️ No privileges available for action: ${actionName}`);
      return false;
    }
  }), [userPrivileges, isSuperUser, isAuthenticated, privilegesLoaded]);

  // Role-based functions
  const roles = useMemo(() => ({
    getUserRole: (): number => {
      if (!isAuthenticated) return 0;
      return userRole || 0;
    },
    getRoleName: (): string => {
      if (!isAuthenticated) return 'Unauthenticated';
      if (isSuperUser) return 'Superuser';
      switch (userRole) {
        case 1: return 'Admin';
        case 2: return 'Manager';
        default: return 'User';
      }
    },
    isAdmin: (): boolean => {
      if (!isAuthenticated) return false;
      return userRole === 1 || isSuperUser;
    },
    isManager: (): boolean => {
      if (!isAuthenticated) return false;
      return userRole === 2 || isSuperUser;
    },
    isUser: (): boolean => {
      if (!isAuthenticated) return false;
      return userRole === 0 && !isSuperUser;
    },
    isSuperUser: (): boolean => {
      if (!isAuthenticated) return false;
      return isSuperUser;
    },
  }), [userRole, isSuperUser, isAuthenticated]);

  // Utility functions
  const utils = useMemo(() => ({
    getAccessibleModules: (): number[] => {
      if (!isAuthenticated) return [];
      if (isSuperUser) {
        return Object.keys(staticModuleDefinitions.modules).map(Number);
      }
      
      // Wait for privileges to be loaded
      if (!privilegesLoaded) {
        console.log(`⏳ Privileges not yet loaded for modules check, waiting...`);
        return [];
      }
      
      const accessibleModules = new Set<number>();
      
      Object.values(staticModuleDefinitions.modules).forEach(module => {
        // Check if user has any of the module's privileges
        const hasModuleAccess = userPrivileges.some(privilege => 
          module.privileges.includes(privilege)
        );
        
        if (hasModuleAccess || module.privileges.length === 0) {
          accessibleModules.add(module.id);
        }
      });
      
      console.log(`🔐 Accessible modules: ${Array.from(accessibleModules).length} modules accessible (User has: ${userPrivileges.length} privileges)`);
      return Array.from(accessibleModules);
    },
    
    getAccessibleRoutes: (): string[] => {
      if (!isAuthenticated) return [];
      if (isSuperUser) {
        const allRoutes: string[] = [];
        Object.values(staticModuleDefinitions.modules).forEach(module => {
          allRoutes.push(...module.routes);
        });
        return allRoutes;
      }
      
      const accessibleRoutes: string[] = [];
      Object.values(staticModuleDefinitions.modules).forEach(module => {
        const hasModuleAccess = userPrivileges.some(privilege => 
          module.privileges.includes(privilege)
        );
        
        if (hasModuleAccess || module.privileges.length === 0) {
          // Add all routes for the module
          accessibleRoutes.push(...module.routes);
        }
      });
      
      console.log(`🔐 Accessible routes: ${accessibleRoutes.length} routes accessible (User has: ${userPrivileges.length} privileges)`);
      return accessibleRoutes;
    },
    
    getModuleInfo: (moduleId: number) => {
      if (!isAuthenticated) return null;
      return staticModuleDefinitions.modules[moduleId];
    },
    
    // New function to get module routes based on user role
    getModuleRoutes: (moduleId: number) => {
      if (!isAuthenticated) return [];
      const module = staticModuleDefinitions.modules[moduleId];
      if (!module) return [];
      
      return module.routes;
    },
    
    // New function to get module privileges
    getModulePrivileges: (moduleId: number) => {
      if (!isAuthenticated) return [];
      const module = staticModuleDefinitions.modules[moduleId];
      return module ? module.privileges : [];
    },
    
    // New function to check if user can access a specific module route
    canAccessModuleRoute: (moduleId: number, route: string): boolean => {
      if (!isAuthenticated) return false;
      if (isSuperUser) return true;
      
      const module = staticModuleDefinitions.modules[moduleId];
      if (!module) return false;
      
      // Check if route exists in the module routes
      return module.routes.includes(route);
    }
  }), [userPrivileges, isSuperUser, isAuthenticated, userRole, privilegesLoaded]);

  return {
    // Permission functions
    ...permissions,
    
    // Role functions
    ...roles,
    
    // Utility functions
    ...utils,
    
    // State
    userPrivileges: isAuthenticated ? userPrivileges : [],
    userRole: isAuthenticated ? userRole : 0,
    isSuperUser: isAuthenticated ? isSuperUser : false,
    privilegesLoaded: isAuthenticated ? privilegesLoaded : false,
    loading: false, // Simplified for now
    error: null, // Simplified for now
    isInitialized: isAuthenticated // Simplified for now
  };
};

export default useSimpleRBAC;
