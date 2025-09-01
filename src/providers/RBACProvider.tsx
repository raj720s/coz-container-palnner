"use client";

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { setRBACUser, clearUserInfo } from '@/store/slices/userInfoSlice';
import { logout as logoutAuth } from '@/store/slices/authSlice';
import { RBACUser } from '@/store/slices/userInfoSlice';

interface RBACProviderProps {
  children: React.ReactNode;
}

/**
 * RBAC Provider - Manages Role-Based Access Control initialization
 * Handles user authentication state and RBAC data management
 */
export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('🔄 RBACProvider useEffect triggered');
    
    // Check if user is authenticated by looking at session storage
    const storedToken = sessionStorage.getItem("auth_token");
    const storedUser = sessionStorage.getItem("auth_user");
    const storedRBACUser = sessionStorage.getItem("rbac_user");
    
    if (!storedToken || !storedUser) {
      console.log('🚪 No authentication data found, clearing everything and redirecting to signin');
      
      // Clear all session storage
      sessionStorage.clear();
      
      // Clear Redux store
      dispatch(clearUserInfo());
      dispatch(logoutAuth());
      
      // Mark as initialized to prevent retries
      setIsInitialized(true);
      
      // Redirect to signin page
      router.push('/signin');
      return;
    }

    try {
      // Parse stored user data
      const userData = JSON.parse(storedUser);
      console.log('🔍 Found stored user:', userData.email);
      
      // Check if we have RBAC data
      if (storedRBACUser) {
        try {
          const rbacUser: RBACUser = JSON.parse(storedRBACUser);
          
          // Check if RBAC is already initialized in Redux to prevent infinite loops
          const currentRBACUser = sessionStorage.getItem("rbac_initialized");
          if (currentRBACUser === rbacUser.privilege_version) {
            console.log('✅ RBAC already initialized, skipping...');
            setIsInitialized(true);
            return; // Already initialized
          }
          
          // Dispatch to Redux store
          dispatch(setRBACUser(rbacUser));
          
          // Mark as initialized to prevent re-initialization
          sessionStorage.setItem("rbac_initialized", rbacUser.privilege_version);
          
          console.log('🔐 RBAC initialized for user:', rbacUser.email, 'with', rbacUser.privileges.length, 'privileges');
          
          // Log superuser status
          if (rbacUser.is_superuser) {
            console.log('👑 Superuser detected - Full system access granted');
          }
          
          setIsInitialized(true);
          
        } catch (error) {
          console.error('Failed to initialize RBAC from session storage:', error);
          
          // Clear corrupted RBAC data
          sessionStorage.removeItem("rbac_user");
          sessionStorage.removeItem("rbac_initialized");
          
          // Clear everything and redirect to signin
          sessionStorage.clear();
          dispatch(clearUserInfo());
          dispatch(logoutAuth());
          
          setIsInitialized(true);
          router.push('/signin');
        }
      } else {
        console.log('⚠️ No RBAC data available, clearing everything and redirecting to signin');
        
        // Clear all session storage
        sessionStorage.clear();
        
        // Clear Redux store
        dispatch(clearUserInfo());
        dispatch(logoutAuth());
        
        // Mark as initialized to prevent retries
        setIsInitialized(true);
        
        // Redirect to signin page
        router.push('/signin');
      }
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      
      // Clear corrupted data and redirect
      sessionStorage.clear();
      dispatch(clearUserInfo());
      dispatch(logoutAuth());
      
      setIsInitialized(true);
      router.push('/signin');
    }
  }, [dispatch, router]);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing RBAC system...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RBACProvider;
