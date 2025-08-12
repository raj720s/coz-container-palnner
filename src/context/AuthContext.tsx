"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: string;
  accessControl?: string[];
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

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
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
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // Simulate API call - replace with actual GCP SSO integration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock authentication logic
      if (email === "admin@company.com" && password === "admin123") {
        const mockUser: User = {
          id: "1",
          email: "admin@company.com",
          name: "Admin User",
          role: "admin",
          company: "Company Name",
          accessControl: [
            "admin/dashboard",
            "admin/user-management",
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
        const mockToken = "mock_jwt_token_" + Date.now();
        
        setUser(mockUser);
        setToken(mockToken);
        
        // Store in session storage
        sessionStorage.setItem("auth_token", mockToken);
        sessionStorage.setItem("auth_user", JSON.stringify(mockUser));
        
        return { success: true };
      } else if (email === "user@company.com" && password === "user123") {
        const mockUser: User = {
          id: "2",
          email: "user@company.com",
          name: "Regular User",
          role: "user",
          company: "Company Name",
          accessControl: [
            "user/dashboard",
            "user/shipment-upload",
            "user/container-planning",
            "user/assignment-results",
            "user/validation-summary",
            "user/repositioning-summary",
          ]
        };
        const mockToken = "mock_jwt_token_" + Date.now();
        
        setUser(mockUser);
        setToken(mockToken);
        
        // Store in session storage
        sessionStorage.setItem("auth_token", mockToken);
        sessionStorage.setItem("auth_user", JSON.stringify(mockUser));
        
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