'use client'
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '@/context/AuthContext';
import { setRBACUser } from '@/store/slices/userInfoSlice';
import { RBACUser } from '@/store/slices/userInfoSlice';

interface RBACProviderProps {
  children: React.ReactNode;
}

/**
 * RBAC Provider that handles RBAC initialization at the app level
 * This prevents infinite loops and ensures RBAC is only initialized once
 */
export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('🔄 RBACProvider useEffect triggered:', { isAuthenticated, hasUser: !!user, isInitialized });
    
    // Only run once when user authentication state changes
    if (isAuthenticated && user && !isInitialized) {
      console.log('🚀 Starting RBAC initialization...');
      
      // Check if we have RBAC data in session storage
      const storedRBACUser = sessionStorage.getItem("rbac_user");
      
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
          setIsInitialized(true); // Mark as initialized even on error to prevent infinite retries
        }
      } else if (user.privileges && user.privilege_version) {
        console.log('📝 Creating RBAC user from AuthContext data...');
        
        // Create RBAC user from AuthContext user data
        const rbacUser: RBACUser = {
          id: parseInt(user.id),
          email: user.email,
          name: user.name,
          role_id: user.role_id || 0,
          role_name: user.role === 'admin' ? 'Admin' : 'User',
          is_superuser: user.is_superuser || false,
          privileges: user.privileges,
          privilege_version: user.privilege_version
        };
        
        // Store in session storage and Redux
        sessionStorage.setItem("rbac_user", JSON.stringify(rbacUser));
        dispatch(setRBACUser(rbacUser));
        
        // Mark as initialized
        sessionStorage.setItem("rbac_initialized", rbacUser.privilege_version);
        
        console.log('🔐 RBAC initialized from AuthContext for user:', rbacUser.email);
        setIsInitialized(true);
      } else {
        console.log('⚠️ No RBAC data available, marking as initialized');
        // No RBAC data available, mark as initialized to prevent retries
        setIsInitialized(true);
      }
    } else if (!isAuthenticated) {
      console.log('🚪 User logged out, resetting RBAC state');
      // User logged out, reset initialization state
      setIsInitialized(false);
    }
  }, [isAuthenticated, user, isInitialized, dispatch]);

  // Show loading state while initializing
  if (isAuthenticated && !isInitialized) {
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
