import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { polService } from '@/services/polService';
import { POLResponse, POLListResponse, POLListRequest, CreatePOLRequest, UpdatePOLRequest } from '@/types/api';

interface POLState {
  pols: POLResponse[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  selectedPOL: POLResponse | null;
  total: number;
  currentPage: number;
  pageSize: number;
}

const initialState: POLState = {
  pols: [],
  loading: false,
  error: null,
  lastFetched: null,
  selectedPOL: null,
  total: 0,
  currentPage: 1,
  pageSize: 10,
};

// Async thunk to fetch POL ports with comprehensive filtering
export const fetchPOLs = createAsyncThunk(
  'pols/fetchPOLs',
  async (params: POLListRequest = {}, { rejectWithValue }) => {
    try {
      const response: POLListResponse = await polService.getPOLs(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch POL ports');
    }
  }
);

// Async thunk to create a POL port
export const createPOL = createAsyncThunk(
  'pols/createPOL',
  async (polData: CreatePOLRequest, { rejectWithValue }) => {
    try {
      const response = await polService.createPOL(polData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to create POL port');
    }
  }
);

// Async thunk to update a POL port
export const updatePOL = createAsyncThunk(
  'pols/updatePOL',
  async ({ id, polData }: { id: string | number; polData: UpdatePOLRequest }, { rejectWithValue }) => {
    try {
      const response = await polService.updatePOL(id, polData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to update POL port');
    }
  }
);

// Async thunk to delete a POL port
export const deletePOL = createAsyncThunk(
  'pols/deletePOL',
  async (id: string | number, { rejectWithValue }) => {
    try {
      await polService.deletePOL(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to delete POL port');
    }
  }
);

// Async thunk to get a single POL port
export const fetchPOLById = createAsyncThunk(
  'pols/fetchPOLById',
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await polService.getPOL(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch POL port');
    }
  }
);

// Async thunk to search POL ports
export const searchPOLs = createAsyncThunk(
  'pols/searchPOLs',
  async ({ query, limit = 10 }: { query: string; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await polService.searchPOLs(query, limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to search POL ports');
    }
  }
);

// Async thunk to get POL ports by country
export const fetchPOLsByCountry = createAsyncThunk(
  'pols/fetchPOLsByCountry',
  async ({ country, params = {} }: { country: string; params?: Omit<POLListRequest, 'country'> }, { rejectWithValue }) => {
    try {
      const response = await polService.getPOLsByCountry(country, params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch POL ports by country');
    }
  }
);

// Async thunk to export POL ports
export const exportPOLs = createAsyncThunk(
  'pols/exportPOLs',
  async (params: POLListRequest = {}, { rejectWithValue }) => {
    try {
      const response = await polService.exportPOLs(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to export POL ports');
    }
  }
);

const polSlice = createSlice({
  name: 'pols',
  initialState,
  reducers: {
    clearPOLs: (state) => {
      state.pols = [];
      state.total = 0;
      state.lastFetched = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setSelectedPOL: (state, action: PayloadAction<POLResponse | null>) => {
      state.selectedPOL = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
    },
    clearSelectedPOL: (state) => {
      state.selectedPOL = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch POL ports
    builder
      .addCase(fetchPOLs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPOLs.fulfilled, (state, action) => {
        state.loading = false;
        state.pols = action.payload.results;
        state.total = action.payload.count;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchPOLs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create POL port
    builder
      .addCase(createPOL.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPOL.fulfilled, (state, action) => {
        state.loading = false;
        state.pols.push(action.payload);
        state.total += 1;
        state.error = null;
      })
      .addCase(createPOL.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update POL port
    builder
      .addCase(updatePOL.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePOL.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.pols.findIndex(pol => pol.id === action.payload.id);
        if (index !== -1) {
          state.pols[index] = action.payload;
        }
        if (state.selectedPOL && state.selectedPOL.id === action.payload.id) {
          state.selectedPOL = action.payload;
        }
        state.error = null;
      })
      .addCase(updatePOL.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete POL port
    builder
      .addCase(deletePOL.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePOL.fulfilled, (state, action) => {
        state.loading = false;
        state.pols = state.pols.filter(pol => pol.id !== Number(action.payload));
        state.total = Math.max(0, state.total - 1);
        if (state.selectedPOL && state.selectedPOL.id === Number(action.payload)) {
          state.selectedPOL = null;
        }
        state.error = null;
      })
      .addCase(deletePOL.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch POL by ID
    builder
      .addCase(fetchPOLById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPOLById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPOL = action.payload;
        state.error = null;
      })
      .addCase(fetchPOLById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Search POL ports
    builder
      .addCase(searchPOLs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchPOLs.fulfilled, (state, action) => {
        state.loading = false;
        state.pols = action.payload;
        state.total = action.payload.length;
        state.error = null;
      })
      .addCase(searchPOLs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch POL ports by country
    builder
      .addCase(fetchPOLsByCountry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPOLsByCountry.fulfilled, (state, action) => {
        state.loading = false;
        state.pols = action.payload.results;
        state.total = action.payload.count;
        state.error = null;
      })
      .addCase(fetchPOLsByCountry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Export POL ports
    builder
      .addCase(exportPOLs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportPOLs.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Note: exported data is not stored in state, just handled by the component
      })
      .addCase(exportPOLs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearPOLs, 
  clearError, 
  setSelectedPOL, 
  setCurrentPage, 
  setPageSize, 
  clearSelectedPOL 
} = polSlice.actions;

// Selectors
export const selectPOLs = (state: { pols: POLState }) => state.pols.pols;
export const selectPOLsLoading = (state: { pols: POLState }) => state.pols.loading;
export const selectPOLsError = (state: { pols: POLState }) => state.pols.error;
export const selectPOLsLastFetched = (state: { pols: POLState }) => state.pols.lastFetched;
export const selectSelectedPOL = (state: { pols: POLState }) => state.pols.selectedPOL;
export const selectPOLsTotal = (state: { pols: POLState }) => state.pols.total;
export const selectPOLsCurrentPage = (state: { pols: POLState }) => state.pols.currentPage;
export const selectPOLsPageSize = (state: { pols: POLState }) => state.pols.pageSize;

export default polSlice.reducer;
