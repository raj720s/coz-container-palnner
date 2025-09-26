import { AppDispatch, RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useCallback } from "react";
import { fetchUsersJson } from "@/store/slices/commonDataSlice";

// Enhanced hook for single data source
export const useCommonData = (thunkAction: any, selector: (state: RootState) => any) => {
  const dispatch = useDispatch<AppDispatch>();
  const state = useSelector(selector);

  useEffect(() => {
    // Check if data exists and if not, dispatch the thunk
    if (!state?.data) {
      dispatch(thunkAction());
    }
  }, [dispatch, thunkAction, state?.data]);
    
  const refresh = useCallback(() => {
    dispatch(thunkAction());
  }, [dispatch, thunkAction]);
    
  return { 
    data: state?.data || null, 
    loading: state?.loading || false, 
    error: state?.error || null, 
    refresh 
  };
};

// Specialized hook for users JSON data
export const useUsersJson = () => {
  const dispatch = useDispatch<AppDispatch>();
  const usersJson = useSelector((state: RootState) => state.commonData.usersJson);
  const loading = useSelector((state: RootState) => state.commonData.isLoading);
  const error = useSelector((state: RootState) => state.commonData.error);
  const initialized = useSelector((state: RootState) => state.commonData.isInitialized);

  useEffect(() => {
    // Check if usersJson is empty and not loading, then fetch
    if (Object.keys(usersJson).length === 0 && !loading && !initialized) {
      dispatch(fetchUsersJson());
    }
  }, [dispatch, usersJson, loading, initialized]);
    
  const refresh = useCallback(() => {
    dispatch(fetchUsersJson());
  }, [dispatch]);

  // Helper function to get user name by ID
  const getUserName = useCallback((userId: string | number): string => {
    const id = userId.toString();
    return usersJson[id] || `User ${id}`;
  }, [usersJson]);
    
  return { 
    usersJson, 
    loading, 
    error, 
    refresh,
    getUserName
  };
};