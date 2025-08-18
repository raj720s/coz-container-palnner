import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useGetUserProfileQuery } from '@/store/api/apiSlice';
import { updateProfileFromAPI } from '@/store/slices/authSlice';

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
      dispatch(updateProfileFromAPI({
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        email: userProfile.email,
        organisation_name: userProfile.organisation_name,
        role_id: userProfile.role_id,
      }));
    }
  }, [userProfile, dispatch]);

  return { userProfile, isLoading, error };
};
