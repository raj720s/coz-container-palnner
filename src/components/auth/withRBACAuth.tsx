"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useRBAC, useRouteAccess } from "@/hooks/useRBAC";

interface WithRBACAuthProps {
  /** Required privilege to access the component */
  privilege?: string;
  /** Multiple privileges - user needs ANY of these */
  anyPrivileges?: string[];
  /** Multiple privileges - user needs ALL of these */
  allPrivileges?: string[];
  /** Required module access */
  module?: string;
  /** Required role (0=user, 1=admin, 2=manager) */
  role?: number | number[];
  /** Redirect URL when access is denied */
  redirectTo?: string;
  /** Show loading while checking permissions */
  showLoading?: boolean;
  /** Custom access denied component */
  AccessDeniedComponent?: React.ComponentType<{ reason: string }>;
}

/**
 * Enhanced HOC for RBAC-based authentication and authorization
 */
export function withRBACAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithRBACAuthProps = {}
) {
  const {
    privilege,
    anyPrivileges,
    allPrivileges,
    module,
    role,
    redirectTo,
    showLoading = true,
    AccessDeniedComponent
  } = options;

  return function RBACAuthenticatedComponent(props: P) {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    
    const {
      hasPrivilege,
      hasAnyPrivilege,
      hasAllPrivileges,
      canAccessModule,
      userRole,
      isAdmin
    } = useRBAC();

    const { canAccess: canAccessCurrentRoute } = useRouteAccess(pathname);

    useEffect(() => {
      if (!loading) {
        // Check authentication
        if (!isAuthenticated) {
          const defaultRedirect = redirectTo || "/signin";
          router.push(defaultRedirect);
          return;
        }

        // Admin bypass - admins can access everything
        if (isAdmin()) {
          return;
        }

        // Check route-level access
        if (!canAccessCurrentRoute) {
          console.warn(`RBAC: Access denied to route ${pathname}`);
          redirectToAppropriateRoute();
          return;
        }

        // Check role requirements
        if (role !== undefined) {
          const allowedRoles = Array.isArray(role) ? role : [role];
          if (!allowedRoles.includes(userRole)) {
            console.warn(`RBAC: Role access denied. Required: ${allowedRoles}, User: ${userRole}`);
            redirectToAppropriateRoute();
            return;
          }
        }

        // Check module access
        if (module && !canAccessModule(module)) {
          console.warn(`RBAC: Module access denied: ${module}`);
          redirectToAppropriateRoute();
          return;
        }

        // Check specific privilege
        if (privilege && !hasPrivilege(privilege)) {
          console.warn(`RBAC: Privilege access denied: ${privilege}`);
          redirectToAppropriateRoute();
          return;
        }

        // Check any privileges
        if (anyPrivileges && anyPrivileges.length > 0 && !hasAnyPrivilege(anyPrivileges)) {
          console.warn(`RBAC: Any privileges access denied: ${anyPrivileges.join(', ')}`);
          redirectToAppropriateRoute();
          return;
        }

        // Check all privileges
        if (allPrivileges && allPrivileges.length > 0 && !hasAllPrivileges(allPrivileges)) {
          console.warn(`RBAC: All privileges access denied: ${allPrivileges.join(', ')}`);
          redirectToAppropriateRoute();
          return;
        }
      }
    }, [
      isAuthenticated, 
      user, 
      loading, 
      pathname, 
      canAccessCurrentRoute,
      userRole,
      privilege,
      anyPrivileges,
      allPrivileges,
      module,
      role
    ]);

    const redirectToAppropriateRoute = () => {
      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      // Default redirects based on role
      switch (userRole) {
        case 1: // Admin
          router.push("/admin/dashboard");
          break;
        case 2: // Manager
          router.push("/admin/dashboard");
          break;
        default: // User
          router.push("/user/dashboard");
          break;
      }
    };

    const getAccessDeniedReason = (): string => {
      if (!isAuthenticated) return "Not authenticated";
      
      if (role !== undefined) {
        const allowedRoles = Array.isArray(role) ? role : [role];
        if (!allowedRoles.includes(userRole)) {
          return `Insufficient role. Required: ${allowedRoles.join(' or ')}, Your role: ${userRole}`;
        }
      }

      if (module && !canAccessModule(module)) {
        return `No access to module: ${module}`;
      }

      if (privilege && !hasPrivilege(privilege)) {
        return `Missing privilege: ${privilege}`;
      }

      if (anyPrivileges && anyPrivileges.length > 0 && !hasAnyPrivilege(anyPrivileges)) {
        return `Missing any of privileges: ${anyPrivileges.join(', ')}`;
      }

      if (allPrivileges && allPrivileges.length > 0 && !hasAllPrivileges(allPrivileges)) {
        return `Missing all privileges: ${allPrivileges.join(', ')}`;
      }

      if (!canAccessCurrentRoute) {
        return `No access to route: ${pathname}`;
      }

      return "Access denied";
    };

    // Show loading spinner
    if (loading && showLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      );
    }

    // Check authentication
    if (!isAuthenticated) {
      return null;
    }

    // Admin bypass - admins can access everything
    if (isAdmin()) {
      return <WrappedComponent {...props} />;
    }

    // Final permission checks
    let hasAccess = true;
    let accessDeniedReason = "";

    // Check route access
    if (!canAccessCurrentRoute) {
      hasAccess = false;
      accessDeniedReason = `No access to route: ${pathname}`;
    }

    // Check role
    if (hasAccess && role !== undefined) {
      const allowedRoles = Array.isArray(role) ? role : [role];
      if (!allowedRoles.includes(userRole)) {
        hasAccess = false;
        accessDeniedReason = `Insufficient role. Required: ${allowedRoles.join(' or ')}, Your role: ${userRole}`;
      }
    }

    // Check module
    if (hasAccess && module && !canAccessModule(module)) {
      hasAccess = false;
      accessDeniedReason = `No access to module: ${module}`;
    }

    // Check privilege
    if (hasAccess && privilege && !hasPrivilege(privilege)) {
      hasAccess = false;
      accessDeniedReason = `Missing privilege: ${privilege}`;
    }

    // Check any privileges
    if (hasAccess && anyPrivileges && anyPrivileges.length > 0 && !hasAnyPrivilege(anyPrivileges)) {
      hasAccess = false;
      accessDeniedReason = `Missing any of privileges: ${anyPrivileges.join(', ')}`;
    }

    // Check all privileges
    if (hasAccess && allPrivileges && allPrivileges.length > 0 && !hasAllPrivileges(allPrivileges)) {
      hasAccess = false;
      accessDeniedReason = `Missing all privileges: ${allPrivileges.join(', ')}`;
    }

    if (!hasAccess) {
      if (AccessDeniedComponent) {
        return <AccessDeniedComponent reason={accessDeniedReason} />;
      }
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

// Convenience HOCs for specific use cases

/**
 * HOC for admin-only access
 */
export const withAdminRBAC = <P extends object>(Component: React.ComponentType<P>) =>
  withRBACAuth(Component, { role: 1 });

/**
 * HOC for manager-only access
 */
export const withManagerRBAC = <P extends object>(Component: React.ComponentType<P>) =>
  withRBACAuth(Component, { role: 2 });

/**
 * HOC for user-only access
 */
export const withUserRBAC = <P extends object>(Component: React.ComponentType<P>) =>
  withRBACAuth(Component, { role: 0 });

/**
 * HOC for admin or manager access
 */
export const withAdminOrManagerRBAC = <P extends object>(Component: React.ComponentType<P>) =>
  withRBACAuth(Component, { role: [1, 2] });

/**
 * HOC for any authenticated user
 */
export const withAnyRBAC = <P extends object>(Component: React.ComponentType<P>) =>
  withRBACAuth(Component);

/**
 * HOC for specific privilege access
 */
export const withPrivilegeRBAC = <P extends object>(
  Component: React.ComponentType<P>,
  privilege: string
) => withRBACAuth(Component, { privilege });

/**
 * HOC for module access
 */
export const withModuleRBAC = <P extends object>(
  Component: React.ComponentType<P>,
  module: string
) => withRBACAuth(Component, { module });

/**
 * HOC for multiple privilege access (any)
 */
export const withAnyPrivilegeRBAC = <P extends object>(
  Component: React.ComponentType<P>,
  privileges: string[]
) => withRBACAuth(Component, { anyPrivileges: privileges });

/**
 * HOC for multiple privilege access (all)
 */
export const withAllPrivilegesRBAC = <P extends object>(
  Component: React.ComponentType<P>,
  privileges: string[]
) => withRBACAuth(Component, { allPrivileges: privileges });

export default withRBACAuth;
