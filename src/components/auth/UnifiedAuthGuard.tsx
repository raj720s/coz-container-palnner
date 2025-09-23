"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";

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

  const authState = useMemo(
    () => ({
      isAuthenticated: auth.isAuthenticated,
      hasUser: !!auth.user,
      contextReady: auth.contextAvailable && auth.isInitialized,
      loading: auth.loading,
    }),
    [auth.isAuthenticated, auth.user, auth.contextAvailable, auth.isInitialized, auth.loading]
  );

  const isPublic = useMemo(() => PUBLIC_ROUTES.includes(pathname), [pathname]);

 

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

    if (isPublic) return;

    if (pathname === "/") {
      router.push(authState.isAuthenticated ? "/dashboard" : "/signin");
      return;
    }

    if (!authState.isAuthenticated || !authState.hasUser) {
      clearAndRedirect("/signin");
    }
  }, [authState, isPublic, pathname, router]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (initializationTimeout.current) {
        clearTimeout(initializationTimeout.current);
      }
    };
  }, []);

  // Debug logging for state values
  console.log('🔍 UnifiedAuthGuard: Render state check', {
    loading: authState.loading,
    contextAvailable: auth.contextAvailable,
    isInitialized: auth.isInitialized,
    contextReady: authState.contextReady,
    isAuthenticated: authState.isAuthenticated,
    hasUser: authState.hasUser
  });

  if (authState.loading || !authState.contextReady) {
    console.log('🔍 UnifiedAuthGuard: Showing initializing screen');
    return <FullScreenMessage text="Initializing..." spinnerColor="border-blue-500" />;
  }

  if (isPublic) return <>{children}</>;

  if (!authState.isAuthenticated || !authState.hasUser) {
    return <FullScreenMessage text="Redirecting to sign in..." spinnerColor="border-yellow-500" />;
  }

  // Authenticated route - show layout with access control
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const mainMargin = useMemo(
    () =>
      isMobileOpen
        ? "ml-0"
        : isExpanded || isHovered
        ? "lg:ml-[290px]"
        : "lg:ml-[90px]",
    [isMobileOpen, isExpanded, isHovered]
  );

  // Check route permissions
  if (!auth.canAccessRoute(pathname)) {
    return (
      <Layout mainMargin={mainMargin}>
        <AccessDeniedMessage pathname={pathname} />
      </Layout>
    );
  }

  return (
    <Layout mainMargin={mainMargin}>
      {children}
    </Layout>
  );
};

export default UnifiedAuthGuard;

/* ---------- Layout & Subcomponents ---------- */

const Layout = ({ mainMargin, children }: { mainMargin: string; children: React.ReactNode }) => (
  <div className="min-h-screen xl:flex">
    <AppSidebar />
    <div className={`flex-1 transition-all duration-300 ease-in-out ${mainMargin}`}>
      <AppHeader />
      <div className="p-4 mx-auto max-w-full md:p-6">{children}</div>
    </div>
    <Backdrop />
  </div>
);

const FullScreenMessage = ({ text, spinnerColor }: { text: string; spinnerColor: string }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="text-center p-8">
      <div
        className={`animate-spin rounded-full h-12 w-12 border-b-2 ${spinnerColor} mx-auto mb-4`}
        role="status"
        aria-label="Loading"
      />
      <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">{text}</p>
      <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Please wait...</p>
    </div>
  </div>
);

const AccessDeniedMessage = ({ pathname }: { pathname: string }) => {
  const router = useRouter();
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center p-6 max-w-lg">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don't have permission to access <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">{pathname}</code>
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mb-6">
            Please contact your administrator if you believe this is an error.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            Go Back
          </button>
          <button onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
