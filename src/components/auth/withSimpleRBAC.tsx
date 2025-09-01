"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSimpleRBAC } from "@/hooks/useSimpleRBAC";
import { useDispatch } from "react-redux";
import { clearUserInfo } from "@/store/slices/userInfoSlice";
import { logout as logoutAuth } from "@/store/slices/authSlice";

export interface WithSimpleRBACProps {
  route?: string;
  privilege?: string;
  anyPrivileges?: string[];
  allPrivileges?: string[];
  action?: string;
  role?: number | number[]; // Now supports single role or array of roles
  allowSuperUserBypass?: boolean;
  redirectTo?: string;
}

export interface RBACContextValue {
  hasPrivilege: (privilege: string) => boolean;
  canPerformAction: (action: string) => boolean;
  isAdmin: () => boolean;
  isSuperUser: boolean;
  userRole: number;
  userPrivileges: string[];
  canAccessRoute: (route: string) => boolean;
  getAccessibleModules: () => any[];
  getModuleInfo: (moduleId: number) => any;
}

export function withSimpleRBAC<P extends object>(
  WrappedComponent: React.ComponentType<P & { rbacContext?: RBACContextValue }>,
  options: WithSimpleRBACProps = {}
) {
  console.log('🔐 withSimpleRBAC - Component:', WrappedComponent.name, 'Options:', options);
  
  return function SimpleRBACAuthenticatedComponent(props: P) {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useDispatch();
    

    const {
      hasPrivilege,
      canPerformAction,
      isAdmin,
      isSuperUser,
      userRole,
      userPrivileges,
      canAccessRoute,
      getAccessibleModules,
      getModuleInfo,
      loading: rbacLoading,
      isInitialized,
    } = useSimpleRBAC();

    // Function to clear everything and redirect to signin
    const clearAndRedirect = () => {
      console.log('🚪 Clearing session storage and Redux store, redirecting to signin');
      sessionStorage.clear();
      dispatch(clearUserInfo());
      dispatch(logoutAuth());
      router.push('/signin');
    };

    useEffect(() => {
      if (!loading && !rbacLoading && isInitialized) {
        // Check authentication - if not authenticated, clear everything and redirect
        if (!isAuthenticated) {
          console.log('🚪 User not authenticated, clearing everything and redirecting to signin');
          clearAndRedirect();
          return;
        }

        // Check if session storage still has valid data
        const storedToken = sessionStorage.getItem("auth_token");
        const storedUser = sessionStorage.getItem("auth_user");

        if (!storedToken || !storedUser) {
          console.log('🚪 Session storage data missing, clearing everything and redirecting to signin');
          clearAndRedirect();
          return;
        }

        // Role-based access control
        if (options.role !== undefined) {
          console.log('🔐 Role check - options.role:', options.role, 'type:', typeof options.role);
          console.log('🔐 Role check - userRole:', userRole, 'type:', typeof userRole);
          
          const userRoleNumber = typeof userRole === 'number' ? userRole : userRole[0]; // Ensure it's a number for comparison
          const requestedRoles = Array.isArray(options.role) ? options.role : [options.role];
          
          console.log('🔐 Role check - userRoleNumber:', userRoleNumber);
          console.log('🔐 Role check - requestedRoles:', requestedRoles);
          console.log('🔐 Role check - includes check:', requestedRoles.includes(userRoleNumber));

          if (!requestedRoles.includes(userRoleNumber)) {
            // Allow superuser bypass if configured
            if (!(options.allowSuperUserBypass && isSuperUser)) {
              console.log('🚫 Role access denied:', options.role, 'User role:', userRole);
              // Role-based redirect: role 1 -> admin/dashboard, others -> user/dashboard
              const redirectPath = userRole === 1 ? '/admin/dashboard' : '/user/dashboard';
              router.push(options.redirectTo || redirectPath);
              return;
            }
          }
        }

        // Wait for privileges to be loaded before proceeding with privilege checks
        if (!userPrivileges || userPrivileges.length === 0) {
          console.log('⏳ Waiting for privileges to load...');
          return; // Don't proceed until privileges are loaded
        }

        // Role-based redirection for access denied cases
        // If any access control fails, redirect based on user role
        const handleAccessDenied = (reason: string) => {
          console.log(`🚫 Access denied: ${reason}`);
          // Role-based redirect: role 1 -> admin/dashboard, others -> user/dashboard
          const redirectPath = userRole === 1 ? '/admin/dashboard' : '/user/dashboard';
          router.push(options.redirectTo || redirectPath);
        };

        // Route-based access control
        if (options.route && !canAccessRoute(options.route)) {
          console.log('🚫 Route access denied:', options.route);
          handleAccessDenied('Route access denied');
          return;
        }

        // Privilege-based access control
        if (options.privilege && !hasPrivilege(options.privilege)) {
          console.log('🚫 Privilege access denied:', options.privilege);
          handleAccessDenied('Privilege access denied');
          return;
        }

        // Multiple privileges check (ANY)
        if (options.anyPrivileges && options.anyPrivileges.length > 0) {
          const hasAnyPrivilege = options.anyPrivileges.some(privilege => hasPrivilege(privilege));
          if (!hasAnyPrivilege) {
            console.log('🚫 Any privilege access denied:', options.anyPrivileges);
            handleAccessDenied('Any privilege access denied');
            return;
          }
        }

        // Multiple privileges check (ALL)
        if (options.allPrivileges && options.allPrivileges.length > 0) {
          const hasAllPrivileges = options.allPrivileges.every(privilege => hasPrivilege(privilege));
          if (!hasAllPrivileges) {
            console.log('🚫 All privileges access denied:', options.allPrivileges);
            handleAccessDenied('All privileges access denied');
            return;
          }
        }

        // Action-based access control
        if (options.action && !canPerformAction(options.action)) {
          console.log('🚫 Action access denied:', options.action);
          handleAccessDenied('Action access denied');
          return;
        }
      }
    }, [
      isAuthenticated, user, loading, rbacLoading, isInitialized, pathname,
      canAccessRoute, canPerformAction, userRole, options.privilege,
      options.anyPrivileges, options.allPrivileges, options.action, options.role, options.allowSuperUserBypass,
      options.route, options.redirectTo, dispatch, router
    ]);

    // Show loading state
    if (loading || rbacLoading || !isInitialized) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      );
    }

    // Show loading state while waiting for privileges
    if (!userPrivileges || userPrivileges.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading user privileges...</p>
          </div>
        </div>
      );
    }

    // Create RBAC context to pass to wrapped component
    const rbacContext: RBACContextValue = {
      hasPrivilege,
      canPerformAction,
      isAdmin,
      isSuperUser,
      userRole,
      userPrivileges,
      canAccessRoute,
      getAccessibleModules,
      getModuleInfo,
    };

    // Pass RBAC context to wrapped component
    return <WrappedComponent {...props} rbacContext={rbacContext} />;
  };
}

export default withSimpleRBAC;
