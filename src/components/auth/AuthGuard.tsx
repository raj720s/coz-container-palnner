"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useDispatch } from 'react-redux';
import { clearUserInfo } from '@/store/slices/userInfoSlice';
import { logout as logoutAuth } from '@/store/slices/authSlice';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * Authentication Guard Component
 * Protects routes and handles unauthenticated users
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true, 
  redirectTo = '/signin' 
}) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const dispatch = useDispatch();

  // Function to clear everything and redirect
  const clearAndRedirect = () => {
    console.log('🚪 AuthGuard: User not authenticated, clearing everything and redirecting');
    
    // Clear all session storage
    sessionStorage.clear();
    
    // Clear Redux store
    dispatch(clearUserInfo());
    dispatch(logoutAuth());
    
    // Redirect to signin page
    router.push(redirectTo);
  };

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !isAuthenticated) {
        // Check if session storage still has valid data
        const storedToken = sessionStorage.getItem("auth_token");
        const storedUser = sessionStorage.getItem("auth_user");
        
        if (!storedToken || !storedUser) {
          console.log('🚪 AuthGuard: Session storage data missing, clearing everything');
          clearAndRedirect();
        } else {
          console.log('🚪 AuthGuard: User not authenticated, redirecting to signin');
          router.push(redirectTo);
        }
      }
    }
  }, [isAuthenticated, loading, requireAuth, redirectTo, router, dispatch]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If authentication is not required, render children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If user is not authenticated, show loading while redirecting
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to signin...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default AuthGuard;
