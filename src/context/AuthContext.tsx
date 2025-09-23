"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useReducer, useMemo, useRef } from "react";
import { authService } from "@/services/authService";
import { tokenAutoRefreshService } from "@/services/tokenAutoRefreshService";
import { privilegeService } from "@/services/privilegeService";
import { staticModules } from "@/config/staticModules";

export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: string;
  accessControl?: string[];
  is_superuser: boolean;
  role_id?: number;
  role_name?: string;
  privileges?: string[];
  module_access?: number[];
  accessible_routes?: string[];
  privilege_version?: string;
  rbac_initialized?: boolean;
  rbac_last_updated?: string;
  first_name?: string;
  last_name?: string;
  organisation_name?: string;
  is_active?: boolean;
  status?: boolean;
  created_on?: string;
  updated_on?: string;
  phone_number?: string | null;
  country_code?: string | null;
  country?: string | null;
  timezone?: string | null;
  last_login?: string;
  modified_on?: string | null;
  created_by?: number | null;
  modified_by?: number | null;
  is_deleted?: boolean;
  announcement_read_flag?: number;
  assigned_customers?: number[];
}

// Consolidated auth state
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  contextAvailable: boolean;
  loading: {
    auth: boolean;
    profile: boolean;
    privileges: boolean;
  };
  errors: {
    auth: string | null;
    profile: string | null;
    privileges: string | null;
  };
}

// Action types for useReducer
type AuthAction =
  | { type: 'SET_LOADING'; payload: { key: keyof AuthState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: { key: keyof AuthState['errors']; value: string | null } }
  | { type: 'SET_AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_CONTEXT_AVAILABLE'; payload: boolean }
  | { type: 'RESET_FOR_INITIALIZATION' };

// Auth reducer for better state management
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.value }
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.payload.key]: action.payload.value }
      };
    case 'SET_AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        contextAvailable: true,
        loading: { auth: false, profile: false, privileges: false },
        errors: { auth: null, profile: null, privileges: null }
      };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isInitialized: true, // Keep initialized as true to prevent re-initialization
        contextAvailable: true, // Keep available to prevent loading state
        loading: { auth: false, profile: false, privileges: false },
        errors: { auth: null, profile: null, privileges: null }
      };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'SET_CONTEXT_AVAILABLE':
      return { ...state, contextAvailable: action.payload };
    case 'RESET_FOR_INITIALIZATION':
      return {
        ...initialAuthState,
        loading: { ...initialAuthState.loading, auth: true }
      };
    default:
      return state;
  }
};

export interface AuthContextType {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  contextAvailable: boolean;
  loading: boolean;
  profileLoading: boolean;
  privilegesLoading: boolean;
  error: string | null;
  profileError: string | null;
  privilegesError: string | null;

  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUserProfile: () => Promise<void>;
  refreshUserPrivileges: (roleId?: number, currentUser?: User | null) => Promise<void>;

  // RBAC functionality
  userRole: number | undefined;
  permissions: string[];
  routes: string[];
  modules: number[];
  isSuperUser: boolean;
  can: (action: string) => boolean;
  canVisit: (route: string) => boolean;
  canAccessModule: (moduleId: number) => boolean;
  canAccessAnyModule: (moduleIds: number[]) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string | string[]) => boolean;
  isAdmin: () => boolean;
  canAccessCustomer: (customerId: number) => boolean;
  getAssignedCustomers: () => number[];
  assignCustomersToUser: (customerIds: number[]) => void;
  removeCustomersFromUser: (customerIds: number[]) => void;
  getUnifiedRoute: (route: string) => string;
  canAccessRoute: (route: string) => boolean;
  redirectToAppropriateDashboard: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Optimized localStorage operations with error handling
class StorageManager {
  private static readonly USER_KEY = "auth_user";
  private static readonly TOKEN_KEY = "auth_token";

  static saveUser(user: User): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user to localStorage:', error);
    }
  }

  static getUser(): User | null {
    try {
      const storedUser = localStorage.getItem(this.USER_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Failed to retrieve user from localStorage:', error);
      this.clearUser(); // Clear corrupted data
      return null;
    }
  }

  static clearUser(): void {
    try {
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error('Failed to clear user from localStorage:', error);
    }
  }

  static getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve token from localStorage:', error);
      return null;
    }
  }

  static clearAll(): void {
    try {
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem("refresh_token");
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
}

// Initial state
const initialAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,
  contextAvailable: false,
  loading: {
    auth: true,
    profile: false,
    privileges: false,
  },
  errors: {
    auth: null,
    profile: null,
    privileges: null,
  },
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const initializationRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Memoized RBAC properties
  const rbacData = useMemo(() => ({
    userRole: state.user?.role_id,
    permissions: state.user?.privileges || [],
    routes: state.user?.accessible_routes || [],
    modules: state.user?.module_access || [],
    isSuperUser: state.user?.is_superuser || false,
  }), [state.user]);

  // Memoized RBAC functions
  const can = useCallback((action: string): boolean => {
    if (!state.user) return false;
    if (state.user.is_superuser) return true;
    return state.user.privileges?.includes(action) || false;
  }, [state.user]);

  const canVisit = useCallback((route: string): boolean => {
    if (!state.user) return false;
    if (state.user.is_superuser) return true;
    return state.user.accessible_routes?.includes(route) || false;
  }, [state.user]);

  const canAccessModule = useCallback((moduleId: number): boolean => {
    if (!state.user) return false;
    if (state.user.is_superuser) return true;
    return state.user.module_access?.includes(moduleId) || false;
  }, [state.user]);

  const canAccessAnyModule = useCallback((moduleIds: number[]): boolean => {
    if (!state.user) return false;
    if (state.user.is_superuser) return true;
    return moduleIds.some(moduleId => state.user?.module_access?.includes(moduleId));
  }, [state.user]);

  const hasRole = useCallback((role: string): boolean => {
    if (!state.user) return false;
    return state.user.role_name?.toLowerCase() === role.toLowerCase();
  }, [state.user]);

  const hasAnyRole = useCallback((roles: string | string[]): boolean => {
    if (!state.user) return false;
    if (state.user.is_superuser) return true;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.some(role => state.user?.role_name?.toLowerCase() === role.toLowerCase());
  }, [state.user]);

  const isAdmin = useCallback((): boolean => {
    return state.user?.role_id === 1 || state.user?.is_superuser || false;
  }, [state.user]);

  const canAccessCustomer = useCallback((customerId: number): boolean => {
    if (!state.user) return false;
    if (state.user.is_superuser || isAdmin()) return true;
    return true; // Can be enhanced with customer assignment logic
  }, [state.user, isAdmin]);

  const getAssignedCustomers = useCallback((): number[] => {
    return state.user?.assigned_customers || [];
  }, [state.user]);

  const assignCustomersToUser = useCallback((customerIds: number[]): void => {
    if (!state.user) return;
    const currentAssignments = state.user.assigned_customers || [];
    const newAssignments = [...new Set([...currentAssignments, ...customerIds])];
    const updatedUser = { ...state.user, assigned_customers: newAssignments };
    dispatch({ type: 'SET_USER', payload: updatedUser });
    StorageManager.saveUser(updatedUser);
  }, [state.user]);

  const removeCustomersFromUser = useCallback((customerIds: number[]): void => {
    if (!state.user) return;
    const newAssignments = (state.user.assigned_customers || []).filter(id => !customerIds.includes(id));
    const updatedUser = { ...state.user, assigned_customers: newAssignments };
    dispatch({ type: 'SET_USER', payload: updatedUser });
    StorageManager.saveUser(updatedUser);
  }, [state.user]);

  const getUnifiedRoute = useCallback((route: string): string => {
    if (route.startsWith('/admin/') || route.startsWith('/user/')) {
      return route.replace(/^\/(admin|user)\//, '/');
    }
    return route;
  }, []);

  const canAccessRoute = useCallback((route: string): boolean => {
    console.log('🔍 canAccessRoute: Checking access for route:', route, {
      user: state.user ? { 
        id: state.user.id, 
        rbac_initialized: state.user.rbac_initialized, 
        accessible_routes: state.user.accessible_routes?.length || 0,
        is_superuser: state.user.is_superuser
      } : null
    });

    if (!state.user) return false;
    if (state.user.is_superuser) return true;

    if (!state.user.rbac_initialized || !state.user.accessible_routes || state.user.accessible_routes.length === 0) {
      const basicRoutes = ['/dashboard', '/profile', '/settings', '/'];
      const unifiedRoute = getUnifiedRoute(route);
      const hasAccess = basicRoutes.includes(unifiedRoute) || basicRoutes.some(basicRoute => unifiedRoute.startsWith(basicRoute));
      console.log('🔍 canAccessRoute: Basic route check result:', hasAccess, 'for route:', unifiedRoute);
      return hasAccess;
    }

    const unifiedRoute = getUnifiedRoute(route);
    const hasAccess = state.user.accessible_routes?.includes(unifiedRoute) || false;
    console.log('🔍 canAccessRoute: RBAC route check result:', hasAccess, 'for route:', unifiedRoute, 'in routes:', state.user.accessible_routes);
    return hasAccess;
  }, [state.user, getUnifiedRoute]);

  const redirectToAppropriateDashboard = useCallback((): string => {
    return state.user ? '/dashboard' : '/signin';
  }, [state.user]);

  // Optimized refresh functions
  const refreshUserProfile = useCallback(async (): Promise<void> => {
    if (!state.token) return;

    dispatch({ type: 'SET_LOADING', payload: { key: 'profile', value: true } });
    dispatch({ type: 'SET_ERROR', payload: { key: 'profile', value: null } });

    try {
      const userProfile = await authService.verifyTokenAndGetProfile();
      if (userProfile && state.user) {
        const updatedUser: User = {
          ...state.user,
          id: userProfile.id?.toString() || state.user.id,
          email: userProfile.email,
          name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || state.user.name,
          role: userProfile.is_superuser ? "admin" : "user",
          company: userProfile.organisation_name || state.user.company,
          is_superuser: userProfile.is_superuser,
          role_id: userProfile.role?.[0]?.id || state.user.role_id,
          role_name: userProfile.role?.[0]?.role_name || state.user.role_name,
          // Preserve additional fields
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          organisation_name: userProfile.organisation_name,
          is_active: userProfile.status,
          status: userProfile.status,
          // ... other profile fields
        };

        dispatch({ type: 'SET_USER', payload: updatedUser });
        StorageManager.saveUser(updatedUser);

        if (updatedUser.role_id && updatedUser.role_id > 0) {
          await refreshUserPrivileges(updatedUser.role_id, updatedUser);
        }
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: { key: 'profile', value: error.message || "Failed to refresh user profile" } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'profile', value: false } });
    }
  }, [state.token, state.user]);

  const refreshUserPrivileges = useCallback(async (roleId?: number, currentUser?: User | null): Promise<void> => {
    const targetRoleId = roleId || state.user?.role_id;
    const targetUser = currentUser || state.user;

    if (!targetRoleId || !targetUser) return;

    dispatch({ type: 'SET_LOADING', payload: { key: 'privileges', value: true } });
    dispatch({ type: 'SET_ERROR', payload: { key: 'privileges', value: null } });

    try {
      const privilegesResponse = await privilegeService.getPrivileges({ role_id: targetRoleId });
      
      if (privilegesResponse) {
        const rolePrivileges: string[] = [];
        const accessibleModules: number[] = [];
        const accessibleRoutes: string[] = [];
        
        if (privilegesResponse.results) {
          privilegesResponse.results.forEach((moduleGroup: any) => {
            const moduleId = parseInt(moduleGroup.module_id);
            accessibleModules.push(moduleId);
            
            if (moduleGroup.privileges) {
              moduleGroup.privileges.forEach((privilege: any) => {
                rolePrivileges.push(privilege.privilege_name);
              });
            }
            
             const staticModule = staticModules[moduleId];
            if (staticModule) {
              console.log('🔍 AuthContext: Adding routes for module', moduleId, ':', staticModule.routes);
              accessibleRoutes.push(...staticModule.routes);
            } else {
              console.warn('⚠️ AuthContext: No static module definition found for module ID:', moduleId);
            }
          });
        }
        
        const updatedUser: User = {
          ...targetUser,
          privileges: rolePrivileges,
          module_access: accessibleModules,
          accessible_routes: accessibleRoutes,
          privilege_version: `api_${Date.now()}_${rolePrivileges.length}`,
          rbac_initialized: true,
          rbac_last_updated: new Date().toISOString()
        };

        console.log('🔍 AuthContext: Complete RBAC data loaded successfully', {
          privileges: rolePrivileges.length,
          modules: accessibleModules.length,
          routes: accessibleRoutes.length,
          accessible_routes: accessibleRoutes,
          user_id: updatedUser.id,
          role_id: updatedUser.role_id
        });

        dispatch({ type: 'SET_USER', payload: updatedUser });
        StorageManager.saveUser(updatedUser);
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: { key: 'privileges', value: error.message || "Failed to refresh user privileges" } });

      const fallbackUser: User = {
        ...targetUser,
        rbac_initialized: false,
        rbac_last_updated: new Date().toISOString()
      };

      dispatch({ type: 'SET_USER', payload: fallbackUser });
      StorageManager.saveUser(fallbackUser);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'privileges', value: false } });
    }
  }, [state.user]);

  // Optimized login function
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'auth', value: true } });
    dispatch({ type: 'SET_ERROR', payload: { key: 'auth', value: null } });

    try {
      const tokenResponse = await authService.login({ email, password });

      if (!tokenResponse?.access || !tokenResponse?.refresh) {
        return { success: false, error: "Invalid credentials" };
      }

      authService.storeTokens(tokenResponse.access, tokenResponse.refresh);
      const userProfile = await authService.verifyTokenAndGetProfile();
      
      if (!userProfile) {
        return { success: false, error: "Failed to fetch user profile" };
      }

      const authUser: User = {
        id: userProfile.id?.toString() || '0',
        email: userProfile.email,
        name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'API User',
        role: userProfile.is_superuser ? "admin" : "user",
        company: userProfile.organisation_name || "API User",
        is_superuser: userProfile.is_superuser,
        role_id: userProfile.role?.[0]?.id || 0,
        role_name: userProfile.role?.[0]?.role_name || 'API User',
        // ... other profile fields
        privileges: [],
        module_access: [],
        accessible_routes: [],
        privilege_version: `api_${Date.now()}`,
        rbac_initialized: false,
        rbac_last_updated: new Date().toISOString()
      };

      const storedToken = authService.getStoredAccessToken();
      dispatch({ type: 'SET_AUTH_SUCCESS', payload: { user: authUser, token: storedToken || '' } });
      StorageManager.saveUser(authUser);

      // Fetch privileges in background
      try {
        await refreshUserPrivileges(authUser.role_id, authUser);
      } catch (privilegeError) {
        console.warn('Failed to fetch privileges during login:', privilegeError);
      }

      dispatch({ type: 'SET_INITIALIZED', payload: true });
      tokenAutoRefreshService.startAutoRefresh();

      return { success: true };
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: { key: 'auth', value: error.message || "Login failed" } });
      return { success: false, error: error.message || "Login failed" };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'auth', value: false } });
    }
  }, [refreshUserPrivileges]);

  // Optimized logout function
  const logout = useCallback(() => {
    console.log('🔍 AuthContext: Logout initiated');
    
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    tokenAutoRefreshService.stopAutoRefresh();
    StorageManager.clearAll();
    dispatch({ type: 'LOGOUT' });
    
    console.log('✅ AuthContext: Logout completed');
  }, []);

  // Optimized initialization effect
  useEffect(() => {
    console.log('🔍 AuthContext: Initialization effect triggered');
    
    // Don't run if unmounted
    if (!mountedRef.current) {
      console.log('🔍 AuthContext: Component unmounted, skipping initialization');
      return;
    }

    if (initializationRef.current) {
      console.log('🔍 AuthContext: Already initialized, skipping');
      return;
    }
    
    console.log('🔍 AuthContext: Starting initialization...');
    initializationRef.current = true;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const initializeAuth = async () => {
      try {
        // Always check if component is still mounted before state updates
        if (!mountedRef.current) return;

        const storedToken = StorageManager.getToken();
        const userData = StorageManager.getUser();

        console.log('🔍 AuthContext: Stored data check', {
          hasToken: !!storedToken,
          hasUser: !!userData,
          userId: userData?.id
        });

        if (storedToken && userData) {
          if (!mountedRef.current) return;
          
          dispatch({ type: 'SET_AUTH_SUCCESS', payload: { user: userData, token: storedToken } });

          const hasCompleteRBACData = userData.privileges &&
            userData.privileges.length > 0 &&
            userData.module_access &&
            userData.module_access.length > 0 &&
            userData.rbac_initialized === true;

          if (!hasCompleteRBACData && userData.role_id) {
            try {
              await refreshUserPrivileges(userData.role_id, userData);
            } catch (privilegeError) {
              console.warn('Failed to fetch privileges during initialization:', privilegeError);
            }
          }

          tokenAutoRefreshService.startAutoRefresh();
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mountedRef.current) {
          StorageManager.clearAll();
        }
      } finally {
        if (mountedRef.current) {
          console.log('🔍 AuthContext: Setting initialization complete');
          dispatch({ type: 'SET_INITIALIZED', payload: true });
          dispatch({ type: 'SET_CONTEXT_AVAILABLE', payload: true });
          dispatch({ type: 'SET_LOADING', payload: { key: 'auth', value: false } });
        }
      }
    };

    initializeAuth();

    return () => {
      abortController.abort();
    };
  }, [refreshUserPrivileges]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoized context value
  const contextValue = useMemo<AuthContextType>(() => ({
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isInitialized: state.isInitialized,
    contextAvailable: state.contextAvailable,
    loading: state.loading.auth,
    profileLoading: state.loading.profile,
    privilegesLoading: state.loading.privileges,
    error: state.errors.auth,
    profileError: state.errors.profile,
    privilegesError: state.errors.privileges,

    // Actions
    login,
    logout,
    refreshUserProfile,
    refreshUserPrivileges,

    // RBAC
    ...rbacData,
    can,
    canVisit,
    canAccessModule,
    canAccessAnyModule,
    hasRole,
    hasAnyRole,
    isAdmin,
    canAccessCustomer,
    getAssignedCustomers,
    assignCustomersToUser,
    removeCustomersFromUser,
    getUnifiedRoute,
    canAccessRoute,
    redirectToAppropriateDashboard,
  }), [
    state,
    rbacData,
    login,
    logout,
    refreshUserProfile,
    refreshUserPrivileges,
    can,
    canVisit,
    canAccessModule,
    canAccessAnyModule,
    hasRole,
    hasAnyRole,
    isAdmin,
    canAccessCustomer,
    getAssignedCustomers,
    assignCustomersToUser,
    removeCustomersFromUser,
    getUnifiedRoute,
    canAccessRoute,
    redirectToAppropriateDashboard,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};