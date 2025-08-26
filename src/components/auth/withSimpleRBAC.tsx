"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSimpleRBAC } from "@/hooks/useSimpleRBAC";

interface WithSimpleRBACProps {
  /** Required privilege to access the component */
  privilege?: string;
  /** Multiple privileges - user needs ANY of these */
  anyPrivileges?: string[];
  /** Multiple privileges - user needs ALL of these */
  allPrivileges?: string[];
  /** Required action permission */
  action?: string;
  /** Required route access */
  route?: string;
  /** Required role (0=user, 1=admin, 2=manager) */
  role?: number | number[];
  /** Allow superuser bypass */
  allowSuperUserBypass?: boolean;
  /** Redirect URL when access is denied */
  redirectTo?: string;
  /** Show loading while checking permissions */
  showLoading?: boolean;
  /** Custom access denied component */
  AccessDeniedComponent?: React.ComponentType<{ reason: string }>;
}

/**
 * Simplified HOC for RBAC-based authentication and authorization
 * This consolidates all RBAC logic into one simple HOC
 */
export function withSimpleRBAC<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithSimpleRBACProps = {}
) {
  const {
    privilege,
    anyPrivileges,
    allPrivileges,
    action,
    route,
    role,
    allowSuperUserBypass = true,
    redirectTo,
    showLoading = true,
    AccessDeniedComponent
  } = options;

  return function SimpleRBACAuthenticatedComponent(props: P) {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    
    const {
      hasPrivilege,
      hasAnyPrivilege,
      hasAllPrivileges,
      canAccessRoute,
      canPerformAction,
      userRole,
      isAdmin,
      isSuperUser,
      loading: rbacLoading,
      error: rbacError,
      isInitialized
    } = useSimpleRBAC();

    // Check if user can access current route
    const canAccessCurrentRoute = route ? canAccessRoute(route) : canAccessRoute(pathname);
    
    // Check if user can perform required action
    const canPerformRequiredAction = action ? canPerformAction(action) : true;

    // Determine access reason for better error messages
    const getAccessDeniedReason = (): string => {
      if (!isAuthenticated) return "User not authenticated";
      
      if (role !== undefined) {
        const allowedRoles = Array.isArray(role) ? role : [role];
        if (!allowedRoles.includes(userRole)) {
          return `Role access denied. Required: ${allowedRoles.join(', ')}, User: ${userRole}`;
        }
      }
      
      if (privilege && !hasPrivilege(privilege)) {
        return `Privilege access denied: ${privilege}`;
      }
      
      if (anyPrivileges && anyPrivileges.length > 0 && !hasAnyPrivilege(anyPrivileges)) {
        return `Any privileges access denied: ${anyPrivileges.join(', ')}`;
      }
      
      if (allPrivileges && allPrivileges.length > 0 && !hasAllPrivileges(allPrivileges)) {
        return `All privileges access denied: ${allPrivileges.join(', ')}`;
      }
      
      if (action && !canPerformRequiredAction) {
        return `Action access denied: ${action}`;
      }
      
      if (!canAccessCurrentRoute) {
        return `Route access denied: ${route || pathname}`;
      }
      
      return "Access denied";
    };

    // Redirect to appropriate route based on user role
    const redirectToAppropriateRoute = () => {
      if (isSuperUser() || isAdmin()) {
        router.push("/admin/dashboard");
      } else {
        router.push("/user/dashboard");
      }
    };

    useEffect(() => {
      if (!loading && !rbacLoading && isInitialized) {
        // Check authentication
        if (!isAuthenticated) {
          const defaultRedirect = redirectTo || "/signin";
          router.push(defaultRedirect);
          return;
        }

        // Superuser/Admin bypass (if allowed)
        if (allowSuperUserBypass && (isSuperUser() || isAdmin())) {
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

        // Check action permission
        if (action && !canPerformRequiredAction) {
          console.warn(`RBAC: Action access denied: ${action}`);
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
      rbacLoading,
      isInitialized,
      pathname, 
      canAccessCurrentRoute,
      canPerformRequiredAction,
      userRole,
      privilege,
      anyPrivileges,
      allPrivileges,
      action,
      role,
      allowSuperUserBypass
    ]);

    // Show loading state
    if (showLoading && (loading || rbacLoading || !isInitialized)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              {loading ? "Authenticating..." : rbacLoading ? "Loading permissions..." : "Initializing..."}
            </p>
          </div>
        </div>
      );
    }

    // Show error state
    if (rbacError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
              ⚠️ RBAC Error
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">
              {rbacError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    // Check if access is denied
    const accessDenied = !isAuthenticated || 
      (!allowSuperUserBypass && !isSuperUser() && !isAdmin()) ||
      !canAccessCurrentRoute ||
      (role !== undefined && !Array.isArray(role) ? role !== userRole : Array.isArray(role) && !role.includes(userRole)) ||
      (action && !canPerformRequiredAction) ||
      (privilege && !hasPrivilege(privilege)) ||
      (anyPrivileges && anyPrivileges.length > 0 && !hasAnyPrivilege(anyPrivileges)) ||
      (allPrivileges && allPrivileges.length > 0 && !hasAllPrivileges(allPrivileges));

    if (accessDenied) {
      if (AccessDeniedComponent) {
        return <AccessDeniedComponent reason={getAccessDeniedReason()} />;
      }
      
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              🚫 Access Denied
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              {getAccessDeniedReason()}
            </p>
            <button
              onClick={() => redirectToAppropriateRoute()}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    // Access granted - render the component
    return <WrappedComponent {...props} />;
  };
}

// Convenience HOCs for common use cases
export const withRouteRBAC = (WrappedComponent: React.ComponentType<any>, route: string) =>
  withSimpleRBAC(WrappedComponent, { route });

export const withActionRBAC = (WrappedComponent: React.ComponentType<any>, action: string) =>
  withSimpleRBAC(WrappedComponent, { action });

export const withPrivilegeRBAC = (WrappedComponent: React.ComponentType<any>, privilege: string) =>
  withSimpleRBAC(WrappedComponent, { privilege });

export const withRoleRBAC = (WrappedComponent: React.ComponentType<any>, role: number | number[]) =>
  withSimpleRBAC(WrappedComponent, { role });

export const withAdminRBAC = (WrappedComponent: React.ComponentType<any>) =>
  withSimpleRBAC(WrappedComponent, { role: 1, allowSuperUserBypass: true });

export const withSuperUserRBAC = (WrappedComponent: React.ComponentType<any>) =>
  withSimpleRBAC(WrappedComponent, { allowSuperUserBypass: false });

export default withSimpleRBAC;
