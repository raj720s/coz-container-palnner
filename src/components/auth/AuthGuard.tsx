"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSimplifiedRBAC } from '@/hooks/useSimplifiedRBAC';
import { useDispatch } from 'react-redux';
import { logout as logoutAuth } from '@/store/slices/consolidatedUserSlice';
import AppHeader from '@/layout/AppHeader';
import AppSidebar from '@/layout/AppSidebar';
import Backdrop from '@/layout/Backdrop';
import { useSidebar } from '@/context/SidebarContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireUser?: boolean;
  redirectTo?: string;
  showLayout?: boolean;
}

/**
 * Comprehensive Authentication and Authorization Guard Component
 * Handles authentication, role-based access control, and layout rendering
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true,
  requireAdmin = false,
  requireUser = false,
  redirectTo,
  showLayout = true
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const { isSuperUser, userRole } = useSimplifiedRBAC();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Function to clear everything and redirect
  const clearAndRedirect = (path: string = '/signin') => {
    console.log('🚪 AuthGuard: Clearing everything and redirecting to', path);
    
    // Clear all session storage
    sessionStorage.clear();
    
    // Clear Redux store
    dispatch(logoutAuth());
    
    // Redirect to specified path
    router.push(path);
  };

  // Determine redirect path based on requirements
  const getRedirectPath = () => {
    if (redirectTo) return redirectTo;
    
    if (requireAdmin) return '/admin/dashboard';
    if (requireUser) return '/user/dashboard';
    return '/signin';
  };

  // Check authentication and authorization
  useEffect(() => {
    if (!loading) {
      // Check authentication requirement
      if (requireAuth && !isAuthenticated) {
        console.log('🚫 AuthGuard: User not authenticated, redirecting to signin');
        clearAndRedirect();
        return;
      }

      // Check admin requirement
      if (requireAdmin && isAuthenticated) {
        if (userRole !== 1 && !isSuperUser) {
          console.log('🚫 AuthGuard: User not admin, redirecting to user dashboard');
          router.push('/user/dashboard');
          return;
        }
      }

      // Check user requirement (non-admin)
      if (requireUser && isAuthenticated) {
        if (userRole === 1 || isSuperUser) {
          console.log('🚫 AuthGuard: Admin user accessing user route, redirecting to admin dashboard');
          router.push('/admin/dashboard');
          return;
        }
      }
    }
  }, [isAuthenticated, loading, isSuperUser, userRole, router, requireAuth, requireAdmin, requireUser]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {requireAdmin ? 'Loading admin panel...' : 
             requireUser ? 'Loading user panel...' : 
             'Authenticating...'}
          </p>
        </div>
      </div>
    );
  }

  // If authentication is not required, render children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Show loading while redirecting
  if (!isAuthenticated || 
      (requireAdmin && userRole !== 1 && !isSuperUser) ||
      (requireUser && (userRole === 1 || isSuperUser))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  // If layout is not required, just render children
  if (!showLayout) {
    return <>{children}</>;
  }

  // Calculate main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  // User is authenticated and authorized - render layout
  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar */}
      <AppSidebar />
      
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-full md:p-6">
          {children}
        </div>
      </div>
      
      {/* Mobile Backdrop */}
      <Backdrop />
    </div>
  );
};

export default AuthGuard;
