import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { customerService } from '@/services/customerService';
import { CustomerResponse, CustomerListResponse, CustomerListRequest, CreateCustomerRequest, UpdateCustomerRequest } from '@/types/api';

interface CustomerState {
  customers: CustomerResponse[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  selectedCustomer: CustomerResponse | null;
  total: number;
  currentPage: number;
  pageSize: number;
}

const initialState: CustomerState = {
  customers: [],
  loading: false,
  error: null,
  lastFetched: null,
  selectedCustomer: null,
  total: 0,
  currentPage: 1,
  pageSize: 10,
};

// Async thunk to fetch customers with comprehensive filtering
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (params: CustomerListRequest = {}, { rejectWithValue }) => {
    try {
      const response: CustomerListResponse = await customerService.getCustomers(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch customers');
    }
  }
);

// Async thunk to create a customer
export const createCustomer = createAsyncThunk(
  'customers/createCustomer',
  async (customerData: CreateCustomerRequest, { rejectWithValue }) => {
    try {
      const response = await customerService.createCustomer(customerData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to create customer');
    }
  }
);

// Async thunk to update a customer
export const updateCustomer = createAsyncThunk(
  'customers/updateCustomer',
  async ({ id, customerData }: { id: string | number; customerData: UpdateCustomerRequest }, { rejectWithValue }) => {
    try {
      const response = await customerService.updateCustomer(id, customerData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to update customer');
    }
  }
);

// Async thunk to patch a customer
export const patchCustomer = createAsyncThunk(
  'customers/patchCustomer',
  async ({ id, customerData }: { id: string | number; customerData: UpdateCustomerRequest }, { rejectWithValue }) => {
    try {
      const response = await customerService.patchCustomer(id, customerData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to patch customer');
    }
  }
);

// Async thunk to delete a customer
export const deleteCustomer = createAsyncThunk(
  'customers/deleteCustomer',
  async (id: string | number, { rejectWithValue }) => {
    try {
      await customerService.deleteCustomer(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to delete customer');
    }
  }
);

// Async thunk to get a single customer
export const fetchCustomerById = createAsyncThunk(
  'customers/fetchCustomerById',
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await customerService.getCustomer(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch customer');
    }
  }
);

// Async thunk to search customers
export const searchCustomers = createAsyncThunk(
  'customers/searchCustomers',
  async ({ query, limit = 10 }: { query: string; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await customerService.searchCustomers(query, limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to search customers');
    }
  }
);

// Async thunk to get customers by country
export const fetchCustomersByCountry = createAsyncThunk(
  'customers/fetchCustomersByCountry',
  async ({ country, params = {} }: { country: string; params?: Omit<CustomerListRequest, 'country'> }, { rejectWithValue }) => {
    try {
      const response = await customerService.getCustomersByCountry(country, params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch customers by country');
    }
  }
);

// Async thunk to export customers
export const exportCustomers = createAsyncThunk(
  'customers/exportCustomers',
  async (params: CustomerListRequest = {}, { rejectWithValue }) => {
    try {
      const response = await customerService.exportCustomers(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to export customers');
    }
  }
);

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    clearCustomers: (state) => {
      state.customers = [];
      state.total = 0;
      state.lastFetched = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setSelectedCustomer: (state, action: PayloadAction<CustomerResponse | null>) => {
      state.selectedCustomer = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
    },
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch customers
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload.results;
        state.total = action.payload.count;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create customer
    builder
      .addCase(createCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customers.push(action.payload);
        state.total += 1;
        state.error = null;
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update customer
    builder
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.customers.findIndex(customer => customer.id === action.payload.id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
        if (state.selectedCustomer && state.selectedCustomer.id === action.payload.id) {
          state.selectedCustomer = action.payload;
        }
        state.error = null;
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Patch customer
    builder
      .addCase(patchCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(patchCustomer.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.customers.findIndex(customer => customer.id === action.payload.id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
        if (state.selectedCustomer && state.selectedCustomer.id === action.payload.id) {
          state.selectedCustomer = action.payload;
        }
        state.error = null;
      })
      .addCase(patchCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete customer
    builder
      .addCase(deleteCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = state.customers.filter(customer => customer.id !== Number(action.payload));
        state.total = Math.max(0, state.total - 1);
        if (state.selectedCustomer && state.selectedCustomer.id === Number(action.payload)) {
          state.selectedCustomer = null;
        }
        state.error = null;
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch customer by ID
    builder
      .addCase(fetchCustomerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCustomer = action.payload;
        state.error = null;
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Search customers
    builder
      .addCase(searchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
        state.total = action.payload.length;
        state.error = null;
      })
      .addCase(searchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch customers by country
    builder
      .addCase(fetchCustomersByCountry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomersByCountry.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload.results;
        state.total = action.payload.count;
        state.error = null;
      })
      .addCase(fetchCustomersByCountry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Export customers
    builder
      .addCase(exportCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Note: exported data is not stored in state, just handled by the component
      })
      .addCase(exportCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearCustomers, 
  clearError, 
  setSelectedCustomer, 
  setCurrentPage, 
  setPageSize, 
  clearSelectedCustomer 
} = customerSlice.actions;

// Selectors
export const selectCustomers = (state: { customers: CustomerState }) => state.customers.customers;
export const selectCustomersLoading = (state: { customers: CustomerState }) => state.customers.loading;
export const selectCustomersError = (state: { customers: CustomerState }) => state.customers.error;
export const selectCustomersLastFetched = (state: { customers: CustomerState }) => state.customers.lastFetched;
export const selectSelectedCustomer = (state: { customers: CustomerState }) => state.customers.selectedCustomer;
export const selectCustomersTotal = (state: { customers: CustomerState }) => state.customers.total;
export const selectCustomersCurrentPage = (state: { customers: CustomerState }) => state.customers.currentPage;
export const selectCustomersPageSize = (state: { customers: CustomerState }) => state.customers.pageSize;

export default customerSlice.reducer;
