import React from 'react';
import { useRBAC } from '@/hooks/useRBAC';

interface PermissionProps {
  children: React.ReactNode;
  /** Required privilege to show content */
  privilege?: string;
  /** Multiple privileges - user needs ANY of these */
  anyPrivileges?: string[];
  /** Multiple privileges - user needs ALL of these */
  allPrivileges?: string[];
  /** Required module access */
  module?: string;
  /** Required route access */
  route?: string;
  /** Required role (0=user, 1=admin, 2=manager) */
  role?: number | number[];
  /** Fallback content when permission is denied */
  fallback?: React.ReactNode;
  /** Invert the permission check */
  not?: boolean;
}

/**
 * Permission component for conditional rendering based on RBAC
 * 
 * @example
 * // Show content only if user has CREATE_USER privilege
 * <Permission privilege="CREATE_USER">
 *   <CreateUserButton />
 * </Permission>
 * 
 * @example
 * // Show content only if user can access route
 * <Permission route="/admin/user-management">
 *   <AdminUserPanel />
 * </Permission>
 * 
 * @example
 * // Show content only for admin or manager
 * <Permission role={[1, 2]}>
 *   <AdminControls />
 * </Permission>
 */
export const Permission: React.FC<PermissionProps> = ({
  children,
  privilege,
  anyPrivileges,
  allPrivileges,
  module,
  route,
  role,
  fallback = null,
  not = false
}) => {
  const {
    hasPrivilege,
    hasAnyPrivilege,
    hasAllPrivileges,
    canAccessModule,
    canAccessRoute,
    userRole
  } = useRBAC();

  let hasPermission = true;

  // Check specific privilege
  if (privilege) {
    hasPermission = hasPermission && hasPrivilege(privilege);
  }

  // Check any privileges
  if (anyPrivileges && anyPrivileges.length > 0) {
    hasPermission = hasPermission && hasAnyPrivilege(anyPrivileges);
  }

  // Check all privileges
  if (allPrivileges && allPrivileges.length > 0) {
    hasPermission = hasPermission && hasAllPrivileges(allPrivileges);
  }

  // Check module access
  if (module) {
    hasPermission = hasPermission && canAccessModule(module);
  }

  // Check route access
  if (route) {
    hasPermission = hasPermission && canAccessRoute(route);
  }

  // Check role
  if (role !== undefined) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    hasPermission = hasPermission && allowedRoles.includes(userRole);
  }

  // Apply inversion if requested
  if (not) {
    hasPermission = !hasPermission;
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

/**
 * Higher-order component for permission-based rendering
 */
export const withPermission = (
  Component: React.ComponentType<any>,
  permissionProps: Omit<PermissionProps, 'children' | 'fallback'>
) => {
  return (props: any) => (
    <Permission {...permissionProps}>
      <Component {...props} />
    </Permission>
  );
};

export default Permission;
