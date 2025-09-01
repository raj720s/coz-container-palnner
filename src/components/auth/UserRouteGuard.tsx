"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSimpleRBAC } from '@/hooks/useSimpleRBAC';
import AppHeader from '@/layout/AppHeader';
import AppSidebar from '@/layout/AppSidebar';
import Backdrop from '@/layout/Backdrop';
import { useSidebar } from '@/context/SidebarContext';

interface UserRouteGuardProps {
  children: React.ReactNode;
}

export const UserRouteGuard: React.FC<UserRouteGuardProps> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const { isSuperUser, userRole } = useSimpleRBAC();
  const router = useRouter();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Check authentication
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        console.log('🚫 UserRouteGuard: User not authenticated, redirecting to signin');
        router.push("/signin");
        return;
      }

      // Redirect admin users (role 1) to admin dashboard
      if (userRole === 1 || isSuperUser) {
        console.log('🚫 UserRouteGuard: Admin user (role 1) accessing user route, redirecting to admin dashboard');
        // router.push("/admin/dashboard");
        return;
      }
    }
  }, [isAuthenticated, loading, isSuperUser, userRole, router]);

  console.log("userRole", userRole);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading user panel...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  if (!isAuthenticated || (userRole === 1 || isSuperUser)) {
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

  // User is authenticated - render user layout
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

export default UserRouteGuard;
