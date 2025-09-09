import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { 
  fetchRoles, 
  selectRoles, 
  selectRolesWithPrivileges,
  selectRolesLoading, 
  selectRolesError, 
  selectRolesLastFetched 
} from '@/store/slices/roleSlice';

/**
 * Custom hook to manage roles in Redux state
 * This hook fetches roles once and shares them across components
 * Following DRY principle - roles are fetched once and reused everywhere
 */
export const useRoles = () => {
  const dispatch = useDispatch<AppDispatch>();
  // Selectors from Redux state
  const roles = useSelector(selectRoles);
  const rolesWithPrivileges = useSelector(selectRolesWithPrivileges);
  const loading = useSelector(selectRolesLoading);
  const error = useSelector(selectRolesError);
  const lastFetched = useSelector(selectRolesLastFetched);

  // Check if we need to fetch roles (never fetched or older than 5 minutes)
  const shouldFetch = useMemo(() => {
    if (!lastFetched) return true;
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return lastFetched < fiveMinutesAgo;
  }, [lastFetched]);

  // Fetch roles if needed
  useEffect(() => {
    if (shouldFetch) {
      dispatch(fetchRoles({ include_privilege_data: true }));
    }
  }, [dispatch, shouldFetch]);

  // Memoized role options for dropdowns
  const roleOptions = useMemo(() => {
    return roles.map(role => ({
      value: role.id,
      label: role.role_name,
      description: role.role_description,
      privileges: role.privilege_names
    }));
  }, [roles]);

  // Get role by ID
  const getRoleById = useMemo(() => {
    return (id: string) => roles.find(role => role.id === id);
  }, [roles]);

  // Get role by name
  const getRoleByName = useMemo(() => {
    return (name: string) => roles.find(role => role.role_name === name);
  }, [roles]);

  // Check if user has specific privilege
  const hasPrivilege = useMemo(() => {
    return (roleId: string, privilegeName: string) => {
      const role = getRoleById(roleId);
      return role?.privilege_names.includes(privilegeName) || false;
    };
  }, [getRoleById]);

  // Get roles with specific privilege
  const getRolesWithPrivilege = useMemo(() => {
    return (privilegeName: string) => {
      return roles.filter(role => role.privilege_names.includes(privilegeName));
    };
  }, [roles]);

  // Refresh roles (force fetch)
  const refreshRoles = () => {
    dispatch(fetchRoles({ include_privilege_data: true }));
  };

  return {
    // State
    roles,
    rolesWithPrivileges,
    loading,
    error,
    lastFetched,
    // Computed values
    roleOptions,
    
    // Utility functions
    getRoleById,
    getRoleByName,
    hasPrivilege,
    getRolesWithPrivilege,
    refreshRoles,
    
    // Actions
    dispatch,
  };
};
