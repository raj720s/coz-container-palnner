"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSimpleRBAC } from '@/hooks/useSimpleRBAC';
import AppHeader from '@/layout/AppHeader';
import AppSidebar from '@/layout/AppSidebar';
import Backdrop from '@/layout/Backdrop';
import { useSidebar } from '@/context/SidebarContext';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const { isSuperUser, userRole } = useSimpleRBAC();
  const router = useRouter();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  console.log('🔐 AdminRouteGuard: isSuperUser', isSuperUser);
  console.log('🔐 AdminRouteGuard: userRole', userRole);
  console.log('🔐 AdminRouteGuard: isAuthenticated', isAuthenticated);
  console.log('🔐 AdminRouteGuard: user', user);

  // Check authentication and admin access
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        console.log('🚫 AdminRouteGuard: User not authenticated, redirecting to signin');
        router.push("/signin");
        return;
      }

      // Check if user has admin access (role 1) or is superuser
      if (userRole !== 1 && !isSuperUser) {
        console.log('🚫 AdminRouteGuard: User not admin (role 1), redirecting to user dashboard');
        router.push("/user/dashboard");
        return;
      }
    }
  }, [isAuthenticated, loading, isSuperUser, userRole, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  if (!isAuthenticated || (userRole !== 1 && !isSuperUser)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Calculate main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  // User is authenticated and has admin access - render admin layout
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

export default AdminRouteGuard;
