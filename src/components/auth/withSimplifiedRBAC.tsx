"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSimplifiedRBAC } from "@/hooks/useSimplifiedRBAC";

export interface WithSimplifiedRBACProps {
  route?: string;
  privilege?: string;
  action?: string;
  feature?: string;
  anyPrivileges?: string[];
  allPrivileges?: string[];
  redirectTo?: string;
  allowSuperUserBypass?: boolean;
}

export function withSimplifiedRBAC<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithSimplifiedRBACProps = {}
) {
  return function SimplifiedRBACComponent(props: P) {
    const router = useRouter();
    const {
      hasRouteAccess,
      hasPrivilege,
      hasActionAccess,
      hasFeatureAccess,
      hasAnyPrivilege,
      hasAllPrivileges,
      isAuthenticated,
      isSuperUser
    } = useSimplifiedRBAC();

    useEffect(() => {
      // Skip checks if not authenticated
      if (!isAuthenticated) {
        router.push('/signin');
        return;
      }

      // Superuser bypass
      if (isSuperUser && options.allowSuperUserBypass !== false) {
        return; // Allow access
      }

      // Route access check
      if (options.route && !hasRouteAccess(options.route)) {
        console.log(`🚫 Route access denied: ${options.route}`);
        router.push(options.redirectTo || '/dashboard');
        return;
      }

      // Privilege check
      if (options.privilege && !hasPrivilege(options.privilege)) {
        console.log(`🚫 Privilege access denied: ${options.privilege}`);
        router.push(options.redirectTo || '/dashboard');
        return;
      }

      // Action access check
      if (options.action && !hasActionAccess(options.action)) {
        console.log(`🚫 Action access denied: ${options.action}`);
        router.push(options.redirectTo || '/dashboard');
        return;
      }

      // Feature access check
      if (options.feature && !hasFeatureAccess(options.feature)) {
        console.log(`🚫 Feature access denied: ${options.feature}`);
        router.push(options.redirectTo || '/dashboard');
        return;
      }

      // Any privileges check
      if (options.anyPrivileges && options.anyPrivileges.length > 0) {
        if (!hasAnyPrivilege(options.anyPrivileges)) {
          console.log(`🚫 Any privilege access denied: ${options.anyPrivileges.join(', ')}`);
          router.push(options.redirectTo || '/dashboard');
          return;
        }
      }

      // All privileges check
      if (options.allPrivileges && options.allPrivileges.length > 0) {
        if (!hasAllPrivileges(options.allPrivileges)) {
          console.log(`🚫 All privileges access denied: ${options.allPrivileges.join(', ')}`);
          router.push(options.redirectTo || '/dashboard');
          return;
        }
      }
    }, [
      isAuthenticated,
      hasRouteAccess,
      hasPrivilege,
      hasActionAccess,
      hasFeatureAccess,
      hasAnyPrivilege,
      hasAllPrivileges,
      isSuperUser,
      router,
      options.route,
      options.privilege,
      options.action,
      options.feature,
      options.anyPrivileges,
      options.allPrivileges,
      options.redirectTo,
      options.allowSuperUserBypass
    ]);

    // Show loading state while checking permissions
    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Checking permissions...</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

// Convenience HOCs for common use cases
export const withRouteAccess = <P extends object>(
  Component: React.ComponentType<P>,
  route: string,
  redirectTo?: string
) => withSimplifiedRBAC(Component, { route, redirectTo });

export const withPrivilege = <P extends object>(
  Component: React.ComponentType<P>,
  privilege: string,
  redirectTo?: string
) => withSimplifiedRBAC(Component, { privilege, redirectTo });

export const withActionAccess = <P extends object>(
  Component: React.ComponentType<P>,
  action: string,
  redirectTo?: string
) => withSimplifiedRBAC(Component, { action, redirectTo });

export const withFeatureAccess = <P extends object>(
  Component: React.ComponentType<P>,
  feature: string,
  redirectTo?: string
) => withSimplifiedRBAC(Component, { feature, redirectTo });

export const withAdminAccess = <P extends object>(
  Component: React.ComponentType<P>,
  redirectTo?: string
) => withSimplifiedRBAC(Component, { 
  anyPrivileges: ['VIEW_ADMIN_DASHBOARD', 'ADMIN_ACCESS'], 
  redirectTo 
});

export const withSuperUserAccess = <P extends object>(
  Component: React.ComponentType<P>,
  redirectTo?: string
) => withSimplifiedRBAC(Component, { 
  privilege: 'SUPERUSER_ACCESS', 
  redirectTo,
  allowSuperUserBypass: true
});

export default withSimplifiedRBAC;

