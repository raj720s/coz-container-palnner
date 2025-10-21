"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthLoadingMessage from "./AuthLoadingMessage";
import AccessDeniedMessage from "./AccessDeniedMessage";

interface Props {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ["/signin", "/signup", "/home", "/error-404"];

const UnifiedAuthGuard: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  
  const redirecting = useRef(false);
  const initializationTimeout = useRef<NodeJS.Timeout | null>(null);
  const redirectTimeout = useRef<NodeJS.Timeout | null>(null);

  const authState = {
    isAuthenticated: auth.isAuthenticated,
    hasUser: !!auth.user,
    contextReady: auth.contextAvailable && auth.isInitialized,
    loading: auth.loading,
    isLoginAttempt: auth.isLoginAttempt,
  };

  const isPublic = PUBLIC_ROUTES.includes(pathname);

 

  const clearAndRedirect = (path = "/signin") => {
    if (redirecting.current) return;
    redirecting.current = true;
    try {
      localStorage.clear();
      auth.logout();
      router.push(path);
    } catch (err) {
      console.error("clearAndRedirect error:", err);
    }
  };

  useEffect(() => {
    if (redirecting.current) return;

    if (authState.loading || !authState.contextReady) {
      // Set a timeout to force initialization if it takes too long
      if (!initializationTimeout.current) {
        initializationTimeout.current = setTimeout(() => {
          console.warn('⚠️ UnifiedAuthGuard: Initialization timeout, forcing to signin');
          clearAndRedirect("/signin");
        }, 5000); // 5 second timeout
      }
      return;
    }

    // Clear timeout if initialization completes
    if (initializationTimeout.current) {
      clearTimeout(initializationTimeout.current);
      initializationTimeout.current = null;
    }

    // If user is on a public route, don't redirect them
    if (isPublic) return;

    // Don't redirect during login attempts to prevent clearing error messages
    if (authState.isLoginAttempt) {
      return;
    }

    // Handle root path redirect
    if (pathname === "/") {
      router.push(authState.isAuthenticated ? "/dashboard" : "/signin");
      return;
    }

    // Only redirect to signin if user is not authenticated and not already on signin page
    if (!authState.isAuthenticated || !authState.hasUser) {
      // Don't redirect if already on signin page to prevent clearing error messages
      if (pathname !== "/signin") {
        // Add a small delay to prevent interfering with login attempts
        if (redirectTimeout.current) {
          clearTimeout(redirectTimeout.current);
        }
        redirectTimeout.current = setTimeout(() => {
          clearAndRedirect("/signin");
        }, 1000); // 1 second delay
      }
    }
  }, [authState, isPublic, pathname, router]);

  // Separate effect to handle signin page specifically
  useEffect(() => {
    // Only run this effect on signin page
    if (pathname !== "/signin") return;
    
    // Don't redirect if login attempt is in progress
    if (authState.isLoginAttempt) {
      return;
    }
    
    // Don't redirect if user is already authenticated (they shouldn't be on signin page)
    if (authState.isAuthenticated && authState.hasUser) {
      // Add a small delay to prevent interfering with login success flow
      setTimeout(() => {
        router.push("/dashboard");
      }, 100);
    }
  }, [pathname, authState.isLoginAttempt, authState.isAuthenticated, authState.hasUser, router]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (initializationTimeout.current) {
        clearTimeout(initializationTimeout.current);
      }
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }
    };
  }, []);

  if (authState.loading || !authState.contextReady) {
    return <AuthLoadingMessage text="Initializing..." spinnerColor="border-blue-500" />;
  }

  if (isPublic) return <>{children}</>;

  if (!authState.isAuthenticated || !authState.hasUser) {
    return <AuthLoadingMessage text="Redirecting to sign in..." spinnerColor="border-yellow-500" />;
  }

  // Authenticated route - check route permissions
  if (!auth.canAccessRoute(pathname)) {
    return <AccessDeniedMessage pathname={pathname} />;
  }

  // Return children for authenticated users with proper access
  return <>{children}</>;
};

export default UnifiedAuthGuard;
