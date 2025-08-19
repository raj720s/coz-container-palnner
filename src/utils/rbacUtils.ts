import moduleDefinitions from "@/config/modules";

export interface UserPermissions {
  role: number;
  privileges: string[];
  modules: string[];
}

export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  routes: string[];
  privileges: string[];
}

/**
 * Get module information by module ID
 */
export const getModuleInfo = (moduleId: string): ModuleInfo => {
  const module = moduleDefinitions.modules[moduleId as keyof typeof moduleDefinitions.modules];
  return module ? {
    id: moduleId,
    ...module
  } : {
    id: moduleId,
    name: `Module ${moduleId}`,
    description: "Unknown module",
    icon: "AlertIcon",
    color: "gray",
    routes: [],
    privileges: []
  };
};

/**
 * Get all available modules
 */
export const getAllModules = (): ModuleInfo[] => {
  return Object.entries(moduleDefinitions.modules).map(([id, module]) => ({
    id,
    ...module
  }));
};

/**
 * Check if user has a specific privilege
 */
export const hasPrivilege = (userPrivileges: string[], requiredPrivilege: string): boolean => {
  return userPrivileges.includes(requiredPrivilege);
};

/**
 * Check if user has any of the required privileges
 */
export const hasAnyPrivilege = (userPrivileges: string[], requiredPrivileges: string[]): boolean => {
  return requiredPrivileges.some(privilege => userPrivileges.includes(privilege));
};

/**
 * Check if user has all required privileges
 */
export const hasAllPrivileges = (userPrivileges: string[], requiredPrivileges: string[]): boolean => {
  return requiredPrivileges.every(privilege => userPrivileges.includes(privilege));
};

/**
 * Check if user can access a specific route
 */
export const canAccessRoute = (userRole: number, userPrivileges: string[], route: string): boolean => {
  // Admin (role 1) has access to everything
  if (userRole === 1) {
    return true;
  }

  // Find which module this route belongs to
  const moduleEntry = Object.entries(moduleDefinitions.modules).find(([_, module]) => 
    module.routes.some(moduleRoute => route.startsWith(moduleRoute))
  );

  if (!moduleEntry) {
    // Route not defined in any module, allow access for now
    return true;
  }

  const [moduleId, module] = moduleEntry;

  // Check if user has access to this module based on role
  const rolePermissions = getRolePermissions(userRole);
  if (!rolePermissions.modules.includes(moduleId)) {
    return false;
  }

  // If module has specific privileges required, check if user has them
  if (module.privileges.length > 0) {
    return hasAnyPrivilege(userPrivileges, module.privileges);
  }

  return true;
};

/**
 * Get role-based permissions
 */
export const getRolePermissions = (role: number): { modules: string[]; privileges: string[] } => {
  const roleKey = role === 1 ? 'admin' : role === 2 ? 'manager' : 'user';
  const roleConfig = moduleDefinitions.rolePermissions[roleKey as keyof typeof moduleDefinitions.rolePermissions];
  
  if (!roleConfig) {
    return { modules: [], privileges: [] };
  }

  return {
    modules: roleConfig.modules,
    privileges: roleConfig.privileges === "*" ? getAllPrivileges() : roleConfig.privileges
  };
};

/**
 * Get all available privileges
 */
export const getAllPrivileges = (): string[] => {
  const allPrivileges: string[] = [];
  Object.values(moduleDefinitions.modules).forEach(module => {
    allPrivileges.push(...module.privileges);
  });
  return [...new Set(allPrivileges)]; // Remove duplicates
};

/**
 * Check if user can access a specific module
 */
export const canAccessModule = (userRole: number, moduleId: string): boolean => {
  // Admin has access to everything
  if (userRole === 1) {
    return true;
  }

  const rolePermissions = getRolePermissions(userRole);
  return rolePermissions.modules.includes(moduleId);
};

/**
 * Get accessible routes for a user
 */
export const getAccessibleRoutes = (userRole: number, userPrivileges: string[]): string[] => {
  const accessibleRoutes: string[] = [];
  
  Object.entries(moduleDefinitions.modules).forEach(([moduleId, module]) => {
    if (canAccessModule(userRole, moduleId)) {
      // If module has specific privileges required, check if user has them
      if (module.privileges.length > 0) {
        if (hasAnyPrivilege(userPrivileges, module.privileges)) {
          accessibleRoutes.push(...module.routes);
        }
      } else {
        accessibleRoutes.push(...module.routes);
      }
    }
  });

  return [...new Set(accessibleRoutes)]; // Remove duplicates
};

/**
 * Filter menu items based on user permissions
 */
export const filterMenuByPermissions = (
  menuItems: any[], 
  userRole: number, 
  userPrivileges: string[]
): any[] => {
  return menuItems.filter(item => {
    if (item.path) {
      return canAccessRoute(userRole, userPrivileges, item.path);
    }
    if (item.subItems) {
      const filteredSubItems = filterMenuByPermissions(item.subItems, userRole, userPrivileges);
      return filteredSubItems.length > 0;
    }
    return true;
  }).map(item => {
    if (item.subItems) {
      return {
        ...item,
        subItems: filterMenuByPermissions(item.subItems, userRole, userPrivileges)
      };
    }
    return item;
  });
};

/**
 * Get module color class for styling
 */
export const getModuleColorClass = (moduleId: string, type: 'bg' | 'text' | 'border' = 'bg'): string => {
  const moduleInfo = getModuleInfo(moduleId);
  const intensity = type === 'bg' ? '500' : type === 'text' ? '600' : '300';
  return `${type}-${moduleInfo.color}-${intensity}`;
};
