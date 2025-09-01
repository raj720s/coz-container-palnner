"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserRBACInfo, setRBACUser } from "@/store/slices/userInfoSlice";
import { RBACUser } from "@/store/slices/userInfoSlice";
import { selectIsAuthenticated, selectUser as selectReduxUser, loginSuccess, logout as logoutAction } from "@/store/slices/authSlice";

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
  privileges?: string[];
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
  const reduxUser = useSelector(selectReduxUser);

  // Initialize auth state from session storage and sync with Redux
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = sessionStorage.getItem("auth_token");
        const storedUser = sessionStorage.getItem("auth_user");
        const storedRBACUser = sessionStorage.getItem("rbac_user");

        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser);
          
          // Dispatch to Redux to sync state
          dispatch(loginSuccess({
            user: {
              id: parseInt(userData.id),
              first_name: userData.name.split(' ')[0] || userData.name,
              last_name: userData.name.split(' ').slice(1).join(' ') || '',
              email: userData.email,
              organisation_name: userData.company || 'Company',
              role: userData.role,
              role_id: userData.role_id || 0,
              is_superuser: userData.is_superuser || false,
              is_active: true,
              status: true,
              created_on: new Date().toISOString(),
              updated_on: new Date().toISOString(),
              phone_number: null,
              country_code: null,
              country: null,
              timezone: null
            },
            token: storedToken
          }));
          
          // Initialize RBAC data if available
          if (storedRBACUser) {
            try {
              const rbacUser = JSON.parse(storedRBACUser);
              // Store RBAC data for use by the RBAC system
              sessionStorage.setItem("rbac_user", JSON.stringify(rbacUser));
            } catch (rbacError) {
              console.warn("Failed to parse stored RBAC data:", rbacError);
            }
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Clear corrupted session storage
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("auth_user");
        sessionStorage.removeItem("rbac_user");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [dispatch]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // Simulate API call - replace with actual GCP SSO integration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock authentication logic
      if (email === "admin@company.com" && password === "admin123") {
        // Admin user with ALL privileges from static modules
        const adminPrivileges = [
          // Role Management (Module 10)
          "CREATE_ROLE", "UPDATE_ROLE", "DELETE_ROLE", "VIEW_ROLE", "VIEW_ROLE_LIST",
          
          // User Management (Module 20)
          "CREATE_USER", "VIEW_USER_LIST", "UPDATE_USER", "UPDATE_USER_PASSWORD", "UPDATE_USER_STATUS", "DELETE_USER",
          
          // Container Management (Module 30)
          "VIEW_CONTAINER_TYPES", "CREATE_CONTAINER_TYPE", "UPDATE_CONTAINER_TYPE", "DELETE_CONTAINER_TYPE",
          "VIEW_CONTAINER_THRESHOLDS", "CREATE_THRESHOLD", "UPDATE_THRESHOLD", "DELETE_THRESHOLD",
          "VIEW_CONTAINER_PRIORITY", "CREATE_PRIORITY", "UPDATE_PRIORITY", "DELETE_PRIORITY",
          "VIEW_CONTAINER_PLANNING", "CREATE_PLAN", "UPDATE_PLAN", "DELETE_PLAN",
          
          // Port & Customer Management (Module 40)
          "VIEW_PORT_CUSTOMER_MASTER", "VIEW_POL_PORTS", "VIEW_POD_PORTS", "VIEW_CUSTOMERS",
          "CREATE_PORT", "UPDATE_PORT", "DELETE_PORT", "CREATE_CUSTOMER", "UPDATE_CUSTOMER", "DELETE_CUSTOMER",
          "CREATE_POL", "UPDATE_POL", "DELETE_POL", "CREATE_POD", "UPDATE_POD", "DELETE_POD",
          "EXPORT_CUSTOMERS", "EXPORT_POL_PORTS", "EXPORT_POD_PORTS",
          
          // Shipment Operations (Module 50)
          "VIEW_SHIPMENT_UPLOAD", "CREATE_SHIPMENT", "UPDATE_SHIPMENT", "DELETE_SHIPMENT",
          "VIEW_SHIPMENT_HISTORY", "VIEW_UPLOADS_HISTORY", "VIEW_INPUT_FILE", "VIEW_OUTPUT_FILE",
          "UPLOAD_SHIPMENT_FILE", "PROCESS_SHIPMENT", "EXPORT_SHIPMENT_DATA",
          
          // Analytics & Reports (Module 60)
          "VIEW_ASSIGNMENT_RESULTS", "VIEW_VALIDATION_SUMMARY", "VIEW_REPOSITIONING_SUMMARY", "VIEW_TEST_VALIDATION",
          "EXPORT_ASSIGNMENT_DATA", "EXPORT_VALIDATION_DATA", "EXPORT_REPOSITIONING_DATA", "RUN_TEST_VALIDATION",
          
          // System Administration (Module 70)
          "VIEW_SYSTEM_SETTINGS", "UPDATE_SYSTEM_SETTINGS", "DELETE_SYSTEM_SETTINGS",
          "VIEW_DATA_BACKUP", "CREATE_DATA_BACKUP", "RESTORE_DATA_BACKUP", "DELETE_DATA_BACKUP",
          
          // Dashboard (Module 80)
          "VIEW_DASHBOARD", "VIEW_USER_DASHBOARD", "VIEW_ADMIN_DASHBOARD"
        ];

        const mockUser: User = {
          id: "1",
          email: "admin@company.com",
          name: "Admin User",
          role: "admin",
          company: "Company",
          is_superuser: true,
          role_id: 1,
          privileges: adminPrivileges,
          privilege_version: `admin_static_${Date.now()}_${adminPrivileges.length}`
        };

        const mockToken = `mock_token_${Date.now()}`;

        // Store in session storage
        sessionStorage.setItem("auth_token", mockToken);
        sessionStorage.setItem("auth_user", JSON.stringify(mockUser));

        // Create RBAC user and store
        const rbacUser: RBACUser = {
          id: parseInt(mockUser.id),
          email: mockUser.email,
          name: mockUser.name,
          role_id: mockUser.role_id || 0,
          role_name: mockUser.role === 'admin' ? 'Admin' : 'User',
          is_superuser: mockUser.is_superuser,
          privileges: mockUser.privileges || [],
          privilege_version: mockUser.privilege_version || `v1_${Date.now()}`
        };

        sessionStorage.setItem("rbac_user", JSON.stringify(rbacUser));

        // Dispatch to Redux
        const reduxUserData = {
          user: {
            id: parseInt(mockUser.id),
            first_name: mockUser.name.split(' ')[0] || mockUser.name,
            last_name: mockUser.name.split(' ').slice(1).join(' ') || '',
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
            timezone: null
          },
          token: mockToken
        };
        
        console.log('🔐 Login: Dispatching to Redux:', reduxUserData);
        dispatch(loginSuccess(reduxUserData));

        setLoading(false);
        return { success: true };
      } else if (email === "user@company.com" && password === "user123") {
        // Regular user with LIMITED privileges from static modules - NO DELETE permissions for POL data
        const userPrivileges = [  
          // User Management (Module 20) - Limited access
          "VIEW_USER", "UPDATE_USER",
          
          // Container Management (Module 30) - View only
          "VIEW_CONTAINER_TYPES", "VIEW_CONTAINER_THRESHOLDS", "VIEW_CONTAINER_PRIORITY", "VIEW_CONTAINER_PLANNING",
          
          // Port & Customer Management (Module 40) - View and Edit only (NO DELETE privileges)
          "VIEW_PORT_CUSTOMER_MASTER", "VIEW_POL_PORTS", "VIEW_POD_PORTS", "VIEW_CUSTOMERS",
          "CREATE_PORT", "UPDATE_PORT", "CREATE_CUSTOMER", "UPDATE_CUSTOMER",
          "CREATE_POL", "UPDATE_POL", "CREATE_POD", "UPDATE_POD",
          // Notice: NO DELETE_PORT, DELETE_POL, DELETE_POD, DELETE_CUSTOMER privileges
          
          // Shipment Operations (Module 50) - Limited access
          "VIEW_SHIPMENT_UPLOAD", "VIEW_SHIPMENT_HISTORY", "VIEW_UPLOADS_HISTORY", "VIEW_INPUT_FILE", "VIEW_OUTPUT_FILE",
          
          // Analytics & Reports (Module 60) - View only
          "VIEW_ASSIGNMENT_RESULTS", "VIEW_VALIDATION_SUMMARY", "VIEW_REPOSITIONING_SUMMARY",
          
          // Dashboard (Module 80)
          "VIEW_DASHBOARD", "VIEW_USER_DASHBOARD"
        ];

        const mockUser: User = {
          id: "3",
          email: "user@company.com",
          name: "Regular User",
          role: "user",
          company: "Company",
          is_superuser: false,
          role_id: 3,
          privileges: userPrivileges,
          privilege_version: `user_static_${Date.now()}_${userPrivileges.length}`
        };

        console.log('🔐 Login: user@company.com - Setting role_id:', mockUser.role_id);
        console.log('🔐 Login: user@company.com - Privileges count:', mockUser.privileges?.length || 0);
        console.log('🔐 Login: user@company.com - Has VIEW_POL_PORTS:', mockUser.privileges?.includes('VIEW_POL_PORTS') || false);

        const mockToken = `mock_token_${Date.now()}`;

        // Store in session storage
        sessionStorage.setItem("auth_token", mockToken);
        sessionStorage.setItem("auth_user", JSON.stringify(mockUser));

        // Create RBAC user and store
        const rbacUser: RBACUser = {
          id: parseInt(mockUser.id),
          email: mockUser.email,
          name: mockUser.name,
          role_id: mockUser.role_id || 0,
          role_name: mockUser.role === 'admin' ? 'Admin' : 'User',
          is_superuser: mockUser.is_superuser,
          privileges: mockUser.privileges || [],
          privilege_version: mockUser.privilege_version || `v1_${Date.now()}`
        };

        sessionStorage.setItem("rbac_user", JSON.stringify(rbacUser));

        // Dispatch to Redux
        dispatch(loginSuccess({
          user: {
            id: parseInt(mockUser.id),
            first_name: mockUser.name.split(' ')[0] || mockUser.name,
            last_name: mockUser.name.split(' ').slice(1).join(' ') || '',
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
            timezone: null
          },
          token: mockToken
        }));

        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, error: "Invalid credentials" };
      }
    } catch (error) {
      setLoading(false);
      return { success: false, error: "Login failed" };
    }
  };

  const logout = () => {
    // Clear session storage
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_user");
    sessionStorage.removeItem("rbac_user");
    sessionStorage.removeItem("rbac_initialized");

    // Dispatch logout to Redux
    dispatch(logoutAction());

    setLoading(false);
  };

  // Use Redux state for authentication status
  const isAuthenticated = reduxIsAuthenticated;
  const user = reduxUser ? {
    id: reduxUser.id.toString(),
    email: reduxUser.email,
    name: `${reduxUser.first_name} ${reduxUser.last_name}`.trim(),
    role: reduxUser.role as UserRole,
    company: reduxUser.organisation_name,
    is_superuser: reduxUser.is_superuser,
    role_id: reduxUser.role_id,
    privileges: [], // Will be loaded from RBAC system
    privilege_version: `redux_${Date.now()}`
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