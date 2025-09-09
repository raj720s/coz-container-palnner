import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  initializeUserState, 
  selectUser, 
  selectUserProfile, 
  selectUserRole, 
  selectUserPrivileges, 
  selectUserLoadingStates, 
  selectUserErrors, 
  selectUserInitialized,
  selectIsAuthenticated,
  updateProfileFromAPI
} from '@/store/slices/consolidatedUserSlice';
import { RootState, AppDispatch } from '@/store';

/**
 * Custom hook to sync user profile data and build complete user state step by step
 * This hook manages the centralized user state and syncs with auth state
 */
export const useProfileSync = () => {
  const dispatch = useDispatch<AppDispatch>();
  const hasUpdatedProfile = useRef(false);
  
  // Get user state from centralized store
  const user = useSelector(selectUser);
  const userProfile = useSelector(selectUserProfile);
  const userRole = useSelector(selectUserRole);
  const userPrivileges = useSelector(selectUserPrivileges);
  const loading = useSelector(selectUserLoadingStates);
  const errors = useSelector(selectUserErrors);
  const isInitialized = useSelector(selectUserInitialized);
  
  // Get current auth state
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Initialize user state when authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isInitialized && !loading.profileLoading && !loading.privilegesLoading) {
      console.log('🔐 Initializing user state for authenticated user');
      // Reset the profile update flag when initializing for a new user
      hasUpdatedProfile.current = false;
      dispatch(initializeUserState()).unwrap().catch(error => {
        console.error('❌ Failed to initialize user state:', error);
      });
    }
  }, [isAuthenticated, user, isInitialized, loading.profileLoading, loading.privilegesLoading, dispatch]);

  // Sync profile data with auth state when user state is updated
  useEffect(() => {
    if (userProfile && userProfile.id > 0 && user && !hasUpdatedProfile.current) {
      // Update auth state with profile data while preserving critical login info
      dispatch(updateProfileFromAPI({
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        email: userProfile.email,
        organisation_name: userProfile.organisation_name,
        status: userProfile.status,
        created_on: userProfile.created_on,
        phone_number: userProfile.phone_number,
        country_code: userProfile.country_code,
        country: userProfile.country,
        timezone: userProfile.timezone,
        // Preserve critical login information
        role: user.role,
        role_id: user.role_id,
        is_superuser: user.is_superuser,
      }));
      
      // Mark as updated to prevent infinite loops
      hasUpdatedProfile.current = true;
    }
  }, [userProfile, dispatch]);

  return { 
    userProfile, 
    userRole, 
    userPrivileges, 
    isLoading: loading.isLoading, 
    profileLoading: loading.profileLoading,
    privilegesLoading: loading.privilegesLoading,
    error: errors.hasError ? (errors.profileError || errors.privilegesError) : null,
    profileError: errors.profileError,
    privilegesError: errors.privilegesError,
    isInitialized,
    user
  };
};
