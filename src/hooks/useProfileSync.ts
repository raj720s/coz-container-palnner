import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useGetUserProfileQuery } from '@/store/api/apiSlice';
import { updateProfileFromAPI } from '@/store/slices/authSlice';
import { UserProfileResponse } from '@/types/api';

/**
 * Custom hook to sync user profile data from RTK Query with Redux auth state
 * This ensures the header and other components always have the latest profile data
 */
export const useProfileSync = () => {
  const dispatch = useDispatch();
  const { data: userProfile, isLoading, error } = useGetUserProfileQuery();

  useEffect(() => {
    if (userProfile) {
      // Sync the profile data with the auth state
      // Map the new API response structure to our User interface
      dispatch(updateProfileFromAPI({
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        email: userProfile.email,
        organisation_name: userProfile.organisation_name,
        role_id: userProfile.role?.[0]?.id || 0, // Extract role_id from role array
        is_superuser: userProfile.is_superuser,
        phone_number: userProfile.phone_number,
        country_code: userProfile.country_code,
        country: userProfile.country,
        timezone: userProfile.timezone,
      }));
    }
  }, [userProfile, dispatch]);

  return { userProfile, isLoading, error };
};
