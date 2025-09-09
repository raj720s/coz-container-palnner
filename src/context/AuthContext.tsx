"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectUser,
  loginSuccess,
  logout as logoutAction,
  refreshTokenFailure,
  initializeUserState
} from "@/store/slices/consolidatedUserSlice";
import { authService } from "@/services/authService";
import { tokenAutoRefreshService } from "@/services/tokenAutoRefreshService";

export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: string;
  accessControl?: string[];
  is_superuser: boolean;
  // RBAC Integration
  role_id?: number;
  role_name?: string;
  privileges?: string[];
  module_access?: number[];
  privilege_version?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  // Get authentication state from Redux
  const reduxIsAuthenticated = useSelector(selectIsAuthenticated);
  const reduxUser = useSelector(selectUser);

  // Initialize auth state from session storage and sync with Redux
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = sessionStorage.getItem("auth_token");
        const storedUser = sessionStorage.getItem("auth_user");

        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser);

          // Dispatch to Redux to sync state
          dispatch(loginSuccess({
            user: {
              id: parseInt(userData.id) || 0,
              first_name: userData.name?.split(' ')[0] || userData.name || 'User',
              last_name: userData.name?.split(' ').slice(1).join(' ') || '',
              email: userData.email || '',
              organisation_name: userData.company || 'Company',
              role: userData.role || 'user',
              role_id: userData.role_id || 0,
              is_superuser: userData.is_superuser || false,
              is_active: true,
              status: true,
              created_on: new Date().toISOString(),
              updated_on: new Date().toISOString(),
              phone_number: null,
              country_code: null,
              country: null,
              timezone: null,
              privileges: userData.privileges || [],
              modules: userData.module_access?.map(String) || [],
              privilege_version: userData.privilege_version || `stored_${Date.now()}`
            },
            token: storedToken
          }));

          // Start auto-refresh service for already authenticated user
          tokenAutoRefreshService.startAutoRefresh();
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Clear corrupted session storage
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("auth_user");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [dispatch]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      // Check if it's a mock user (admin@company.com or user@company.com)
      const isMockUser = email === "admin@company.com" || email === "user@company.com";

      if (isMockUser) {
        // Handle mock authentication for admin@company.com and user@company.com
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (email === "admin@company.com" && password === "admin123") {
          // Admin user with ALL privileges from static modules (simplified names)
          const adminPrivileges = [
            // Role Management (Module 10)
            "CREATE_ROLE", "UPDATE_ROLE", "DELETE_ROLE", "VIEW_ROLE", "VIEW_ROLE_LIST",
            "CREATE_ROLE_PERMISSION", "VIEW_ROLE_PERMISSION_LIST",

            // Privilege Management (Module 20)
            "VIEW_PRIVILEGE_LIST",

            // Role Permission Management (Module 30)
            "CREATE_ROLE_PERMISSION", "VIEW_ROLE_PERMISSION_LIST",

            // User Management (Module 40)
            "CREATE_USER", "UPDATE_USER", "DELETE_USER", "VIEW_USER", "VIEW_USER_LIST",
            "VIEW_USER_SHORT_INFO_LIST", "UPDATE_USER_PASSWORD", "UPDATE_USER_STATUS",

            // Container Management (Module 50)
            "VIEW CONTAINER TYPES", "CREATE CONTAINER TYPE", "EDIT CONTAINER TYPE", "DELETE CONTAINER TYPE",
            "VIEW CONTAINER THRESHOLDS", "CREATE THRESHOLD", "EDIT THRESHOLD", "DELETE THRESHOLD",
            "VIEW CONTAINER PRIORITY", "CREATE PRIORITY", "EDIT PRIORITY", "DELETE PRIORITY",
            "VIEW CONTAINER PLANNING", "CREATE PLAN", "EDIT PLAN", "DELETE PLAN",

            // Port & Customer Management (Module 60)
            "VIEW PORT CUSTOMER MASTER", "VIEW POL PORTS", "VIEW POD PORTS", "VIEW CUSTOMERS",
            "CREATE PORT", "EDIT PORT", "DELETE PORT", "CREATE CUSTOMER", "EDIT CUSTOMER", "DELETE CUSTOMER",
            "EXPORT CUSTOMERS", "EXPORT POL PORTS", "EXPORT POD PORTS",

            // Shipment Operations (Module 70)
            "VIEW SHIPMENT UPLOAD", "CREATE SHIPMENT", "EDIT SHIPMENT", "DELETE SHIPMENT",
            "VIEW SHIPMENT HISTORY", "VIEW UPLOADS HISTORY", "VIEW INPUT FILE", "VIEW OUTPUT FILE",
            "UPLOAD SHIPMENT FILE", "PROCESS SHIPMENT", "EXPORT SHIPMENT DATA",

            // Analytics & Reports (Module 80)
            "VIEW ASSIGNMENT RESULTS", "VIEW VALIDATION SUMMARY", "VIEW REPOSITIONING SUMMARY", "VIEW TEST VALIDATION",
            "EXPORT ASSIGNMENT DATA", "EXPORT VALIDATION DATA", "EXPORT REPOSITIONING DATA", "RUN TEST VALIDATION",

            // System Administration (Module 90)
            "VIEW SYSTEM SETTINGS", "EDIT SYSTEM SETTINGS", "DELETE SYSTEM SETTINGS",
            "VIEW DATA BACKUP", "CREATE DATA BACKUP", "RESTORE DATA BACKUP", "DELETE DATA BACKUP",

            // Dashboard (Module 100)
            "VIEW DASHBOARD", "VIEW USER DASHBOARD", "VIEW ADMIN DASHBOARD"
          ];

          const mockUser: User = {
            id: "1",
            email: "admin@company.com",
            name: "Admin User",
            role: "admin",
            company: "Company",
            is_superuser: true,
            role_id: 1,
            role_name: "Admin",
            privileges: adminPrivileges,
            module_access: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100], // All modules for admin
            privilege_version: `admin_static_${Date.now()}_${adminPrivileges.length}`
          };

          const mockToken = `mock_token_${Date.now()}`;

          // Store in session storage
          sessionStorage.setItem("auth_token", mockToken);
          sessionStorage.setItem("auth_user", JSON.stringify(mockUser));

          // Dispatch to Redux
          const reduxUserData = {
            user: {
              id: parseInt(mockUser.id),
              first_name: mockUser.name?.split(' ')[0] || mockUser.name || 'User',
              last_name: mockUser.name?.split(' ').slice(1).join(' ') || '',
              email: mockUser.email,
              organisation_name: mockUser.company || 'Company',
              role: mockUser.role,
              role_id: mockUser.role_id || 0,
              is_superuser: mockUser.is_superuser,
              is_active: true,
              status: true,
              created_on: new Date().toISOString(),
              updated_on: new Date().toISOString(),
              phone_number: null,
              country_code: null,
              country: null,
              timezone: null,
              privileges: mockUser.privileges || [],
              modules: mockUser.module_access?.map(String) || [],
              privilege_version: mockUser.privilege_version || `mock_${Date.now()}`
            },
            token: mockToken
          };

          console.log('🔐 Login: Dispatching to Redux:', reduxUserData);
          dispatch(loginSuccess(reduxUserData));

          // Start auto-refresh service for mock admin user
          tokenAutoRefreshService.startAutoRefresh();

          setLoading(false);
          return { success: true };
        } else if (email === "user@company.com" && password === "user123") {
          // Regular user with LIMITED privileges from static modules (simplified names)
          const userPrivileges = [
            // User Management (Module 40) - Limited access
            "VIEW_USER", "VIEW_USER_SHORT_INFO_LIST",

            // Container Management (Module 50) - View only
            "VIEW CONTAINER TYPES", "VIEW CONTAINER THRESHOLDS", "VIEW CONTAINER PRIORITY", "VIEW CONTAINER PLANNING",

            // Port & Customer Management (Module 60) - View and Edit only (NO DELETE privileges)
            "VIEW PORT CUSTOMER MASTER", "VIEW POL PORTS", "VIEW POD PORTS", "VIEW CUSTOMERS",
            "CREATE PORT", "EDIT PORT", "CREATE CUSTOMER", "EDIT CUSTOMER",
            "EXPORT CUSTOMERS", "EXPORT POL PORTS", "EXPORT POD PORTS",
            // Notice: NO DELETE PORT, DELETE CUSTOMER privileges

            // Shipment Operations (Module 70) - Limited access
            "VIEW SHIPMENT UPLOAD", "VIEW SHIPMENT HISTORY", "VIEW UPLOADS HISTORY", "VIEW INPUT FILE", "VIEW OUTPUT FILE",
            "UPLOAD SHIPMENT FILE", "PROCESS SHIPMENT", "EXPORT SHIPMENT DATA",

            // Analytics & Reports (Module 80) - View only
            "VIEW ASSIGNMENT RESULTS", "VIEW VALIDATION SUMMARY", "VIEW TEST VALIDATION",
            "EXPORT ASSIGNMENT DATA", "EXPORT VALIDATION DATA", "RUN TEST VALIDATION",

            // Dashboard (Module 100)
            "VIEW DASHBOARD", "VIEW USER DASHBOARD"
          ];

          const mockUser: User = {
            id: "3",
            email: "user@company.com",
            name: "Regular User",
            role: "user",
            company: "Company",
            is_superuser: false,
            role_id: 3,
            role_name: "Regular User",
            privileges: userPrivileges,
            module_access: [40, 50, 60, 70, 80, 100], // Limited modules for regular user
            privilege_version: `user_static_${Date.now()}_${userPrivileges.length}`
          };

          console.log('🔐 Login: user@company.com - Setting role_id:', mockUser.role_id);
          console.log('🔐 Login: user@company.com - Privileges count:', mockUser.privileges?.length || 0);
          console.log('🔐 Login: user@company.com - Has VIEW_POL_PORTS:', mockUser.privileges?.includes('VIEW_POL_PORTS') || false);

          const mockToken = `mock_token_${Date.now()}`;

          // Store in session storage
          sessionStorage.setItem("auth_token", mockToken);
          sessionStorage.setItem("auth_user", JSON.stringify(mockUser));

          // Dispatch to Redux
          dispatch(loginSuccess({
            user: {
              id: parseInt(mockUser.id),
              first_name: mockUser.name?.split(' ')[0] || mockUser.name || 'User',
              last_name: mockUser.name?.split(' ').slice(1).join(' ') || '',
              email: mockUser.email,
              organisation_name: mockUser.company || 'Company',
              role: mockUser.role,
              role_id: mockUser.role_id || 0,
              is_superuser: mockUser.is_superuser,
              is_active: true,
              status: true,
              created_on: new Date().toISOString(),
              updated_on: new Date().toISOString(),
              phone_number: null,
              country_code: null,
              country: null,
              timezone: null,
              privileges: mockUser.privileges || [],
              modules: mockUser.module_access?.map(String) || [],
              privilege_version: mockUser.privilege_version || `mock_${Date.now()}`
            },
            token: mockToken
          }));

          // Start auto-refresh service for mock user
          tokenAutoRefreshService.startAutoRefresh();

          setLoading(false);
          return { success: true };
        } else {
          setLoading(false);
          return { success: false, error: "Invalid credentials" };
        }
      } else {
        // Handle API authentication for all other users
        try {
          const tokenResponse = await authService.login({ email, password });

           console.log('🔐 Login: tokenResponse:', tokenResponse);

          if(!tokenResponse) {
            setLoading(false);
            return { success: false, error: "Invalid credentials" };
          }


          if(tokenResponse.access && tokenResponse.refresh) {
            authService.storeTokens(tokenResponse.access, tokenResponse.refresh);
          } else {
            setLoading(false);
            return { success: false, error: "Invalid credentials" };
          }

          const userProfile = await authService.getUserProfile();
          
          if(!userProfile) {
            setLoading(false);
            return { success: false, error: "Failed to fetch user profile" };
          }

          console.log('🔐 Login: userProfile:', userProfile);

          // Create user object from API profile
          const apiUser: User = {
            id: userProfile.id?.toString() || '0',
            email: userProfile.email,
            name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'API User',
            role: userProfile.is_superuser ? "admin" : "user",
            company: userProfile.organisation_name || "API User",
            is_superuser: userProfile.is_superuser,
            role_id: userProfile.role?.[0]?.id || 0,
            role_name: userProfile.role?.[0]?.role_name || 'API User',
            privileges: [], // Will be loaded by initializeUserState
            module_access: [], // Will be loaded by initializeUserState
            privilege_version: `api_${Date.now()}`
          };

          // Store user data in session storage
          sessionStorage.setItem("auth_user", JSON.stringify(apiUser));

          // Dispatch to Redux with basic user data
          // The privileges and modules will be loaded by initializeUserState
          dispatch(loginSuccess({
            user: {
              id: userProfile.id,
              first_name: userProfile.first_name,
              last_name: userProfile.last_name,
              email: userProfile.email,
              organisation_name: userProfile.organisation_name || 'API User',
              role: userProfile.role?.[0]?.role_name || 'API User',
              role_id: userProfile.role?.[0]?.id || 0,
              is_superuser: userProfile.is_superuser,
              is_active: userProfile.status,
              status: userProfile.status,
              created_on: userProfile.created_on,
              updated_on: userProfile.modified_on || userProfile.created_on,
              phone_number: userProfile.phone_number,
              country_code: userProfile.country_code,
              country: userProfile.country,
              timezone: userProfile.timezone,
              privileges: [], // Will be loaded by initializeUserState
              modules: [], // Will be loaded by initializeUserState
              privilege_version: `api_${Date.now()}`
            },
            token: `Bearer ${tokenResponse.access}`,
            refreshToken: tokenResponse.refresh
          }));

          // Initialize user state to fetch privileges and modules
          // This will be handled by the useProfileSync hook after login

          // Start auto-refresh service for API users
          tokenAutoRefreshService.startAutoRefresh();

          setLoading(false);
          return { success: true };
        } catch (apiError: any) {
          console.error('API authentication error:', apiError);
          setLoading(false);
          return { success: false, error: apiError.message || "API authentication failed" };
        }
      }
    } catch (error) {
      setLoading(false);
      return { success: false, error: "Login failed" };
    }
  };

  const logout = () => {
    // Stop auto-refresh service
    tokenAutoRefreshService.stopAutoRefresh();

    // Clear session storage
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("auth_user");

    // Dispatch logout to Redux (now includes clearing user state)
    dispatch(logoutAction());

    setLoading(false);
  };

  // Use Redux state for authentication status
  const isAuthenticated = reduxIsAuthenticated;
  const user = reduxUser && reduxUser.id ? {
    id: reduxUser.id.toString(),
    email: reduxUser.email || '',
    name: `${reduxUser.first_name || ''} ${reduxUser.last_name || ''}`.trim() || 'User',
    role: (reduxUser.role as UserRole) || 'user',
    company: reduxUser.organisation_name || '',
    accessControl: reduxUser.privileges || [],
    is_superuser: reduxUser.is_superuser || false,
    role_id: reduxUser.role_id || 0,
    role_name: reduxUser.role || 'User',
    privileges: reduxUser.privileges || [],
    module_access: reduxUser.modules?.map(Number) || [],
    privilege_version: reduxUser.privilege_version || `redux_${Date.now()}`
  } : null;

  const value: AuthContextType = {
    user,
    token: null, // Token is managed by Redux
    isAuthenticated,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 