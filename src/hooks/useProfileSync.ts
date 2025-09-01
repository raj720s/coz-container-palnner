import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetUserProfileQuery } from '@/store/api/apiSlice';
import { updateProfileFromAPI } from '@/store/slices/authSlice';
import { fetchUserPrivileges } from '@/store/slices/userInfoSlice';
import { UserProfileResponse } from '@/types/api';
import { RootState, AppDispatch } from '@/store';

/**
 * Custom hook to sync user profile data from RTK Query with Redux auth state
 * This ensures the header and other components always have the latest profile data
 * Also fetches user privileges from the server API
 */
export const useProfileSync = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data: userProfile, isLoading, error } = useGetUserProfileQuery();
  
  // Get current auth state to check if we need to fetch privileges
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (userProfile) {
      // Only update non-critical profile data (name, email, org, etc.)
      // Critical login info (role_id, is_superuser) is preserved in auth state
      dispatch(updateProfileFromAPI({
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        email: userProfile.email,
        organisation_name: userProfile.organisation_name,
        // DO NOT override role information - preserve login state
        // role: userProfile.role?.[0]?.role_name || 'User',
        // role_id: userProfile.role?.[0]?.id || 0,
        // is_superuser: userProfile.is_superuser,
        status: userProfile.status,
        created_on: userProfile.created_on,
        phone_number: userProfile.phone_number,
        country_code: userProfile.country_code,
        country: userProfile.country,
        timezone: userProfile.timezone,
      }));

      // Use the login role_id for privilege fetching, not API role_id
      const loginRoleId = user?.role_id;
      if (loginRoleId && loginRoleId > 0) {
        console.log('🔐 Profile sync: Fetching privileges for login role_id:', loginRoleId);
        dispatch(fetchUserPrivileges({ role_id: loginRoleId })).unwrap().catch(error => {
          console.error('❌ Failed to fetch privileges:', error);
        });
      } else {
        console.warn('⚠️ Profile sync: No valid login role_id found, skipping privilege fetch');
      }
    }
  }, [userProfile, dispatch, user?.role_id]);

  // Also fetch privileges when user state changes (e.g., after login)
  useEffect(() => {
    if (user && user.role_id && user.role_id > 0) {
      console.log('🔐 Auth state change: Fetching privileges for role_id:', user.role_id);
      dispatch(fetchUserPrivileges({ role_id: user.role_id })).unwrap().catch(error => {
        console.error('❌ Failed to fetch privileges:', error);
      });
    }
  }, [user?.role_id, dispatch]);

  return { userProfile, isLoading, error };
};
