"use client";

import { useAuth, UserRole } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { User } from "@/types/user";
import { 
  validateRouteAccess, 
  getRequiredRoleForRoute, 
  isPublicRoute,
  isAdminRoute,
  isUserRoute 
} from "@/utils/accessControl";

interface WithAuthProps {
  requiredRole?: UserRole;
  redirectTo?: string;
  requiredRoute?: string;
  strictAccessControl?: boolean; // If true, enforces exact route matching
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  { 
    requiredRole, 
    redirectTo = "/signin", 
    requiredRoute, 
    strictAccessControl = false 
  }: WithAuthProps = {}
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (!loading) {
        // Check authentication
        if (!isAuthenticated) {
          router.push(redirectTo);
          return;
        }

        // Get current route (remove leading slash)
        const currentRoute = pathname.replace(/^\//, '');
        
        // Check if current route is public
        if (isPublicRoute(currentRoute)) {
          return; // Allow access to public routes
        }

        // Validate route access using enhanced access control
        if (user) {
          const userWithAccess = user as User & { accessControl?: string[] };
          const userAccessControl = userWithAccess.accessControl || [];
          
          // Use enhanced route validation
          const routeValidation = validateRouteAccess(
            user.role,
            userAccessControl,
            currentRoute
          );

          if (!routeValidation.hasAccess) {
            console.warn(`Access denied to ${currentRoute}: ${routeValidation.reason}`);
            
            // Redirect to appropriate dashboard based on role
            if (user.role === "admin") {
              router.push("/admin/dashboard");
            } else {
              router.push("/user/dashboard");
            }
            return;
          }
        }

        // Check role-based access if specified
        if (requiredRole && user?.role !== requiredRole) {
          // Redirect based on role
          if (user?.role === "admin") {
            router.push("/admin/dashboard");
          } else {
            router.push("/user/dashboard");
          }
          return;
        }

        // Check specific route access if required
        if (requiredRoute && user) {
          const userWithAccess = user as User & { accessControl?: string[] };
          const userAccessControl = userWithAccess.accessControl || [];
          
          const routeValidation = validateRouteAccess(
            user.role,
            userAccessControl,
            requiredRoute
          );

          if (!routeValidation.hasAccess) {
            console.warn(`Required route access denied: ${requiredRoute}: ${routeValidation.reason}`);
            
            if (user.role === "admin") {
              router.push("/admin/dashboard");
            } else {
              router.push("/user/dashboard");
            }
            return;
          }
        }

        // Strict access control check (if enabled)
        if (strictAccessControl && user) {
          const userWithAccess = user as User & { accessControl?: string[] };
          const userAccessControl = userWithAccess.accessControl || [];
          
          // Check if user has explicit access to current route
          if (!userAccessControl.includes(currentRoute)) {
            console.warn(`Strict access control: Route ${currentRoute} not in user's access control list`);
            
            if (user.role === "admin") {
              router.push("/admin/dashboard");
            } else {
              router.push("/user/dashboard");
            }
            return;
          }
        }
      }
    }, [isAuthenticated, user, loading, requiredRole, requiredRoute, redirectTo, router, pathname, strictAccessControl]);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    // Final role check
    if (requiredRole && user?.role !== requiredRole) {
      return null;
    }

    // Final route access check
    if (requiredRoute && user) {
      const userWithAccess = user as User & { accessControl?: string[] };
      const userAccessControl = userWithAccess.accessControl || [];
      
      const routeValidation = validateRouteAccess(
        user.role,
        userAccessControl,
        requiredRoute
      );

      if (!routeValidation.hasAccess) {
        return null;
      }
    }

    return <WrappedComponent {...props} />;
  };
}

// Specific HOCs for different roles
export const withAdminAuth = <P extends object>(Component: React.ComponentType<P>) =>
  withAuth(Component, { requiredRole: "admin" });

export const withUserAuth = <P extends object>(Component: React.ComponentType<P>) =>
  withAuth(Component, { requiredRole: "user" });

export const withAnyAuth = <P extends object>(Component: React.ComponentType<P>) =>
  withAuth(Component);

// Route-specific HOCs
export const withRouteAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRoute: string
) => withAuth(Component, { requiredRoute });

// Strict access control HOC
export const withStrictAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthProps = {}
) => withAuth(Component, { ...options, strictAccessControl: true });

// Admin-only route access
export const withAdminRouteAuth = <P extends object>(
  Component: React.ComponentType<P>
) => withAuth(Component, { 
  requiredRole: "admin",
  strictAccessControl: true 
});

// User-only route access
export const withUserRouteAuth = <P extends object>(
  Component: React.ComponentType<P>
) => withAuth(Component, { 
  requiredRole: "user",
  strictAccessControl: true 
}); 