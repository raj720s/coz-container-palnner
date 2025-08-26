"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchUserRBACInfo, setRBACUser } from "@/store/slices/userInfoSlice";
import { RBACUser } from "@/store/slices/userInfoSlice";

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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from session storage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = sessionStorage.getItem("auth_token");
        const storedUser = sessionStorage.getItem("auth_user");
        const storedRBACUser = sessionStorage.getItem("rbac_user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
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
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // Simulate API call - replace with actual GCP SSO integration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock authentication logic
      if (email === "admin@company.com" && password === "admin123") {
        // Superuser with ALL privileges
        const allPrivileges = [
          // System Management
          "VIEW_SYSTEM_SETTINGS", "UPDATE_SYSTEM_SETTINGS", "DELETE_SYSTEM_SETTINGS",
          
          // Role Management (Module 10)
          "CREATE_ROLE", "UPDATE_ROLE", "DELETE_ROLE", "VIEW_ROLE", "VIEW_ROLE_LIST",
          "CREATE_ROLE_PERMISSION", "VIEW_ROLE_PERMISSION_LIST",
          
          // User Management (Module 20)
          "CREATE_USER", "UPDATE_USER", "DELETE_USER", "VIEW_USER", "VIEW_USER_LIST",
          "UPDATE_USER_PASSWORD", "UPDATE_USER_STATUS", "VIEW_USER_SHORT_INFO_LIST",
          
          // Container Types (Module 30)
          "VIEW_CONTAINER_TYPES", "CREATE_CONTAINER_TYPE", "UPDATE_CONTAINER_TYPE", "DELETE_CONTAINER_TYPE",
          
          // Container Priority (Module 31)
          "VIEW_CONTAINER_PRIORITY", "CREATE_PRIORITY", "UPDATE_PRIORITY", "DELETE_PRIORITY",
          
          // Container Thresholds (Module 32)
          "VIEW_CONTAINER_THRESHOLDS", "CREATE_THRESHOLD", "UPDATE_THRESHOLD", "DELETE_THRESHOLD",
          
          // Port Management (Module 40)
          "VIEW_PORT_CUSTOMER_MASTER", "VIEW_POL_PORTS", "VIEW_POD_PORTS", "VIEW_CUSTOMERS",
          "CREATE_PORT", "UPDATE_PORT", "DELETE_PORT",
          
          // Shipment Operations (Module 50)
          "VIEW_SHIPMENT_UPLOAD", "CREATE_SHIPMENT", "UPDATE_SHIPMENT", "DELETE_SHIPMENT",
          "VIEW_SHIPMENT_HISTORY", "VIEW_UPLOADS_HISTORY",
          
          // Container Planning (Module 60)
          "VIEW_CONTAINER_PLANNING", "CREATE_PLAN", "UPDATE_PLAN", "DELETE_PLAN",
          
          // Results & Reports (Module 70)
          "VIEW_ASSIGNMENT_RESULTS", "VIEW_VALIDATION_SUMMARY", "VIEW_REPOSITIONING_SUMMARY",
          "EXPORT_DATA", "IMPORT_DATA", "VIEW_DATA_BACKUP",
          
          // Dashboard Access
          "VIEW_DASHBOARD", "VIEW_ADMIN_DASHBOARD", "VIEW_USER_DASHBOARD",
          
          // Test & Validation
          "VIEW_TEST_VALIDATION", "RUN_TESTS", "VIEW_TEST_RESULTS"
        ];

        const mockUser: User = {
          id: "1",
          email: "admin@company.com",
          name: "Admin User",
          role: "admin",
          company: "Company Name",
          is_superuser: true,
          role_id: 1,
          privileges: allPrivileges,
          privilege_version: `superuser_${Date.now()}_${allPrivileges.length}`,
          accessControl: [
            "admin/dashboard",
            "admin/user-management",
            "admin/role-management",
            "admin/container-types",
            "admin/container-thresholds",
            "admin/container-priority",
            "admin/port-customer-master",
            "admin/port-customer-master/pol-ports",
            "admin/port-customer-master/pod-ports",
            "admin/port-customer-master/customers",
            "admin/shipment-upload",
            "admin/container-planning",
            "admin/assignment-results",
            "admin/repositioning-summary",
            "admin/validation-summary",
            "admin/data-backup",
            "admin/system-settings",
            "admin/test-validation",
            "admin/shipment-operations/uploads-history",
            "admin/shipment-operations/shipment-history",
            "user/dashboard",
            "user/shipment-upload",
            "user/container-planning",
            "user/assignment-results",
            "user/validation-summary",
            "user/repositioning-summary",
            "user/test",
          ]
        };

        // Create RBAC user object for Redux store
        const rbacUser: RBACUser = {
          id: 1,
          email: mockUser.email,
          name: mockUser.name,
          role_id: 1,
          role_name: "Superuser",
          is_superuser: true,
          privileges: allPrivileges,
          privilege_version: mockUser.privilege_version!
        };

        const mockToken = "mock_jwt_token_" + Date.now();
        
        setUser(mockUser);
        setToken(mockToken);
        
        // Store in session storage
        sessionStorage.setItem("auth_token", mockToken);
        sessionStorage.setItem("auth_user", JSON.stringify(mockUser));
        
        // Initialize RBAC in Redux store
        try {
          // Dispatch to Redux store to set RBAC user
          // Note: We'll need to access dispatch from the component that uses this context
          // For now, we'll store the RBAC data in session storage
          sessionStorage.setItem("rbac_user", JSON.stringify(rbacUser));
        } catch (error) {
          console.warn("RBAC initialization failed:", error);
        }
        
        return { success: true };
      } else if (email === "user@company.com" && password === "user123") {
        // Regular user with limited privileges
        const userPrivileges = [
          "VIEW_USER_DASHBOARD",
          "VIEW_SHIPMENT_UPLOAD",
          "VIEW_CONTAINER_PLANNING",
          "VIEW_ASSIGNMENT_RESULTS",
          "VIEW_VALIDATION_SUMMARY",
          "VIEW_REPOSITIONING_SUMMARY",
          "VIEW_CONTAINER_TYPES",
          "VIEW_CONTAINER_THRESHOLDS",
          "VIEW_CONTAINER_PRIORITY"
        ];

        const mockUser: User = {
          id: "2",
          email: "user@company.com",
          name: "Regular User",
          role: "user",
          company: "Company Name",
          is_superuser: false,
          role_id: 0,
          privileges: userPrivileges,
          privilege_version: `user_${Date.now()}_${userPrivileges.length}`,
          accessControl: [
            "user/dashboard",
            "user/shipment-upload",
            "user/container-planning",
            "user/assignment-results",
            "user/validation-summary",
            "user/repositioning-summary",
          ]
        };

        // Create RBAC user object for Redux store
        const rbacUser: RBACUser = {
          id: 2,
          email: mockUser.email,
          name: mockUser.name,
          role_id: 0,
          role_name: "User",
          is_superuser: false,
          privileges: userPrivileges,
          privilege_version: mockUser.privilege_version!
        };

        const mockToken = "mock_jwt_token_" + Date.now();
        
        setUser(mockUser);
        setToken(mockToken);
        
        // Store in session storage
        sessionStorage.setItem("auth_token", mockToken);
        sessionStorage.setItem("auth_user", JSON.stringify(mockUser));
        sessionStorage.setItem("rbac_user", JSON.stringify(rbacUser));
        
        return { success: true };
      } else {
        return { success: false, error: "Invalid credentials" };
      }
    } catch (error) {
      return { success: false, error: "Login failed. Please try again." };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_user");
    sessionStorage.removeItem("rbac_user");
    sessionStorage.removeItem("rbac_initialized");
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
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