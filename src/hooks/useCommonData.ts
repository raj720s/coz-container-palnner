import { AppDispatch, RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useCallback } from "react";

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
