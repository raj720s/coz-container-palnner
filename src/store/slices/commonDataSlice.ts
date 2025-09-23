import { ContainerPriorityResponse } from '@/types/api';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ContainerTypeResponse, PODListResponse , POLListResponse } from '@/types/api';
import superAxios from '@/utils/superAxios';
// Removed userInfoSlice dependency - using AuthContext instead
import { RootState } from '@reduxjs/toolkit/query/react';
import podService, { PODService } from '@/services/podService';
import { polService } from '@/services';

interface CommonDataState {
  
  polList: POLListResponse[];
  podList: PODListResponse[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  isInitialized: boolean;
}

const  initialState: CommonDataState = {
  
  polList: [],
  podList: [],
  isLoading: false,
  error: null,
  lastFetched: null,
  isInitialized: false,
};



  export const fetchPortOfLoading = createAsyncThunk(
    'commonData/fetchPortOfLoading',
    async (_, { rejectWithValue }) => {
      try {

        const response = await polService.getPOLs({
          page: 1,
          page_size: 1000,
          order_by: "created_on",
          order_type: "desc"
        });

        return response.results;
        // return response.data;
      } catch (error: any) {
        return rejectWithValue(
          error.response?.data?.detail || error.message || 'Failed to fetch port of loading'
        );
      }
    }
  );

  export const fetchPortOfDischarge = createAsyncThunk(
    'commonData/fetchPortOfDischarge',
    async (_, { rejectWithValue }) => {
      try {
        const response = await podService.getPODs({
            page: 1,
            page_size: 1000,
            order_by: "created_on",
            order_type: "desc"
          });

          return response.results;
      } catch (error: any) {
        return rejectWithValue(
          error.response?.data?.detail || error.message || 'Failed to fetch port of discharge'
        );
      }
    }
  );


const commonDataSlice = createSlice({
  name: 'commonData',
  initialState,
  reducers: {
  
  

    setPortOfLoading: (state, action: PayloadAction<POLListResponse[]>) => {
      state.polList = action.payload;
      state.isInitialized = true;
      state.lastFetched = Date.now();
      state.error = null;
    },
    
    setPortOfDischarge: (state, action: PayloadAction<PODListResponse[]>) => {
      state.podList = action.payload;
      state.isInitialized = true;
      state.lastFetched = Date.now();
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch Container Types
    
      .addCase(fetchPortOfLoading.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortOfLoading.fulfilled, (state, action: PayloadAction<POLListResponse[]>) => {
        state.isLoading = false;
        state.polList = action.payload;
        state.isInitialized = true;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchPortOfLoading.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isInitialized = true;
      })
      .addCase(fetchPortOfDischarge.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortOfDischarge.fulfilled, (state, action: PayloadAction<PODListResponse[]>) => {
        state.isLoading = false;
        state.podList = action.payload;
        state.isInitialized = true;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchPortOfDischarge.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isInitialized = true;
      });
  },
});

export const {  setPortOfLoading, setPortOfDischarge } = commonDataSlice.actions;
export const selectPortOfLoading = (state: { commonData: CommonDataState }) => state.commonData.polList;
export const selectPortOfDischarge = (state: { commonData: CommonDataState }) => state.commonData.podList;
export const selectPortOfLoadingLoading = (state: { commonData: CommonDataState }) => state.commonData.isLoading;
export const selectPortOfDischargeLoading = (state: { commonData: CommonDataState }) => state.commonData.isLoading;
export const selectPortOfLoadingError = (state: { commonData: CommonDataState }) => state.commonData.error;
export const selectPortOfDischargeError = (state: { commonData: CommonDataState }) => state.commonData.error;
export const selectPortOfLoadingInitialized = (state: { commonData: CommonDataState }) => state.commonData.isInitialized;
export const selectPortOfDischargeInitialized = (state: { commonData: CommonDataState }) => state.commonData.isInitialized;

export default commonDataSlice.reducer;