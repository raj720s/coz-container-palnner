# POL (Port of Loading) API Integration Guide

## Overview
This document describes the complete integration of POL (Port of Loading) APIs into the COZ application. The integration includes all CRUD operations, comprehensive filtering, pagination, export functionality, and seamless integration with existing UI components.

## API Endpoints Integrated

### 1. Create POL
**Endpoint:** `POST /api/master-data/v1/pol`  
**Purpose:** Create a new Port of Loading entry

**Request Body:**
```json
{
  "name": "string",
  "code": "string",
  "country": "string",
  "city": "string",
  "timezone": "string",
  "is_active": true
}
```

**Response:**
```json
{
  "id": 1,
  "name": "string",
  "code": "string",
  "country": "string",
  "city": "string",
  "timezone": "string",
  "is_active": true,
  "created_on": "2024-01-01T00:00:00Z",
  "modified_on": "2024-01-01T00:00:00Z"
}
```

### 2. Get POL by ID
**Endpoint:** `GET /api/master-data/v1/pol/{id}`  
**Purpose:** Retrieve a specific POL port by ID

### 3. Update POL
**Endpoint:** `PUT /api/master-data/v1/pol/{id}`  
**Purpose:** Update an existing POL port

### 4. Delete POL
**Endpoint:** `DELETE /api/master-data/v1/pol/{id}`  
**Purpose:** Delete a POL port (uses reusable delete modal)

### 5. List/Filter POL
**Endpoint:** `POST /api/master-data/v1/pol/list`  
**Purpose:** Retrieve POL ports with comprehensive filtering and pagination

**Request Body:**
```json
{
  "name": "string",
  "code": "string",
  "country": "string",
  "city": "string",
  "timezone": "string",
  "order_by": "string",
  "order_type": "string",
  "created_on_start_date": "2025-08-21T07:47:35.622Z",
  "created_by": 0,
  "modified_by": 0,
  "created_by_name": "string",
  "created_on_end_date": "2025-08-21T07:47:35.622Z",
  "modified_by_name": "string",
  "modified_on_start_date": "2025-08-21T07:47:35.622Z",
  "modified_on_end_date": "2025-08-21T07:47:35.622Z",
  "page": 1,
  "page_size": 1,
  "export": false,
  "module_id": 0
}
```

## Implementation Architecture

### 1. Service Layer (`app/src/services/polService.ts`)

The POL service extends the base service and provides all CRUD operations:

```typescript
export class POLService extends BaseService {
  protected readonly basePath = '/master-data/v1';

  async createPOL(polData: CreatePOLRequest): Promise<POLResponse>
  async getPOL(id: string | number): Promise<POLResponse>
  async updatePOL(id: string | number, polData: UpdatePOLRequest): Promise<POLResponse>
  async deletePOL(id: string | number): Promise<{ success: boolean }>
  async getPOLs(params: POLListRequest = {}): Promise<POLListResponse>
  async searchPOLs(query: string, limit?: number): Promise<POLResponse[]>
  async getPOLsByCountry(country: string, params?: POLListRequest): Promise<POLListResponse>
  async getPOLsByCity(city: string, params?: POLListRequest): Promise<POLListResponse>
  async exportPOLs(params?: POLListRequest): Promise<POLResponse[]>
  async validatePOLCode(code: string, excludeId?: string | number): Promise<{ isUnique: boolean }>
}
```

### 2. Type Definitions (`app/src/types/api.ts`)

Comprehensive TypeScript interfaces for all POL operations:

```typescript
export interface CreatePOLRequest {
  name: string;
  code: string;
  country: string;
  city: string;
  timezone: string;
  is_active: boolean;
}

export interface POLResponse {
  id: number;
  name: string;
  code: string;
  country: string;
  city: string;
  timezone: string;
  is_active: boolean;
  created_on?: string;
  modified_on?: string;
  created_by?: number;
  modified_by?: number;
}

export interface POLListRequest {
  name?: string;
  code?: string;
  country?: string;
  city?: string;
  timezone?: string;
  order_by?: string;
  order_type?: string;
  created_on_start_date?: string;
  created_by?: number;
  modified_by?: number;
  created_by_name?: string;
  created_on_end_date?: string;
  modified_by_name?: string;
  modified_on_start_date?: string;
  modified_on_end_date?: string;
  page?: number;
  page_size?: number;
  export?: boolean;
  module_id?: number;
}
```

### 3. Redux Store Integration

#### RTK Query API Slice (`app/src/store/api/apiSlice.ts`)
Provides automatic caching and synchronization:

```typescript
// POL management endpoints
getPOLs: builder.query<POLListResponse, POLListRequest>
getPOL: builder.query<POLResponse, number>
createPOL: builder.mutation<POLResponse, CreatePOLRequest>
updatePOL: builder.mutation<POLResponse, { id: number; data: UpdatePOLRequest }>
deletePOL: builder.mutation<ApiResponse, number>
searchPOLs: builder.query<POLResponse[], string>
getPOLsByCountry: builder.query<POLListResponse, { country: string; params?: POLListRequest }>
getPOLsByCity: builder.query<POLListResponse, { city: string; params?: POLListRequest }>
```

#### Redux Slice (`app/src/store/slices/polSlice.ts`)
State management with async thunks:

```typescript
// Async thunks
export const fetchPOLs = createAsyncThunk(...)
export const createPOL = createAsyncThunk(...)
export const updatePOL = createAsyncThunk(...)
export const deletePOL = createAsyncThunk(...)
export const fetchPOLById = createAsyncThunk(...)
export const searchPOLs = createAsyncThunk(...)
export const fetchPOLsByCountry = createAsyncThunk(...)
export const exportPOLs = createAsyncThunk(...)

// Selectors
export const selectPOLs = (state) => state.pols.pols
export const selectPOLsLoading = (state) => state.pols.loading
export const selectPOLsError = (state) => state.pols.error
// ... more selectors
```

### 4. UI Components

#### Updated PortForm (`app/src/components/forms/PortForm.tsx`)
Enhanced form component with new fields:
- Port Code
- Port Name  
- Country (dropdown)
- City (text input)
- Timezone (dropdown with UTC offsets)
- Port Type (POL/POD)
- Active status (checkbox)

#### POL Ports Client (`app/src/app/(admin)/admin/port-customer-master/pol-ports/POLPortsClient.tsx`)
Completely rewritten component with:
- Real-time data from APIs
- Advanced filtering and search
- Sortable table columns
- Pagination
- Export functionality
- Reusable delete confirmation modal
- Error handling and loading states
- Statistics cards

## Usage Examples

### 1. Using Redux with Async Thunks

```typescript
import { useDispatch, useSelector } from 'react-redux';
import { fetchPOLs, createPOL, updatePOL, deletePOL } from '@/store/slices/polSlice';

const MyComponent = () => {
  const dispatch = useDispatch();
  const pols = useSelector(selectPOLs);
  const loading = useSelector(selectPOLsLoading);
  const error = useSelector(selectPOLsError);

  // Fetch POL ports with filters
  const loadPOLs = () => {
    dispatch(fetchPOLs({
      page: 1,
      page_size: 20,
      country: 'China',
      is_active: true,
      order_by: 'name',
      order_type: 'asc'
    }));
  };

  // Create new POL port
  const handleCreate = async (polData) => {
    try {
      await dispatch(createPOL(polData)).unwrap();
      toast.success('POL port created successfully');
    } catch (error) {
      toast.error('Failed to create POL port');
    }
  };
};
```

### 2. Using RTK Query Hooks

```typescript
import { 
  useGetPOLsQuery, 
  useCreatePOLMutation, 
  useUpdatePOLMutation, 
  useDeletePOLMutation 
} from '@/store/api/apiSlice';

const MyComponent = () => {
  const { data: pols, isLoading, error, refetch } = useGetPOLsQuery({
    page: 1,
    page_size: 10,
    country: 'USA'
  });

  const [createPOL] = useCreatePOLMutation();
  const [updatePOL] = useUpdatePOLMutation();
  const [deletePOL] = useDeletePOLMutation();

  const handleCreate = async (polData) => {
    try {
      await createPOL(polData).unwrap();
      toast.success('POL port created successfully');
    } catch (error) {
      toast.error('Failed to create POL port');
    }
  };
};
```

### 3. Using Service Directly

```typescript
import { polService } from '@/services';

const MyUtility = {
  async exportPOLData() {
    try {
      const exportData = await polService.exportPOLs({
        export: true,
        page_size: 1000,
        is_active: true
      });
      
      // Process export data
      return exportData;
    } catch (error) {
      console.error('Export failed:', error);
    }
  },

  async validatePortCode(code: string) {
    try {
      const { isUnique } = await polService.validatePOLCode(code);
      return isUnique;
    } catch (error) {
      console.error('Validation failed:', error);
      return false;
    }
  }
};
```

## Key Features Implemented

### 1. Comprehensive CRUD Operations
- ✅ Create POL ports with full validation
- ✅ Read/fetch POL ports with filtering
- ✅ Update POL ports with partial data
- ✅ Delete POL ports with confirmation modal

### 2. Advanced Filtering & Search
- ✅ Filter by name, code, country, city
- ✅ Date range filtering (created/modified)
- ✅ User-based filtering (created by/modified by)
- ✅ Status filtering (active/inactive)
- ✅ Full-text search across multiple fields

### 3. UI/UX Enhancements
- ✅ Reusable delete confirmation modal
- ✅ Loading states and error handling
- ✅ Real-time search with debouncing
- ✅ Sortable table columns
- ✅ Responsive design
- ✅ Statistics cards showing counts
- ✅ Export functionality with CSV download

### 4. State Management
- ✅ Redux slice with proper async thunks
- ✅ RTK Query integration for caching
- ✅ Error state management
- ✅ Loading state management
- ✅ Optimistic updates

### 5. Form Integration
- ✅ Updated PortForm with new fields
- ✅ Timezone selection with UTC offsets
- ✅ Country dropdown with comprehensive list
- ✅ Form validation with Zod schema
- ✅ Proper form state management

### 6. Export Functionality
- ✅ CSV export with proper formatting
- ✅ Customizable export filters
- ✅ Automatic filename generation
- ✅ Browser download trigger

## Testing the Integration

### 1. Manual Testing Checklist

**Create POL Port:**
- [ ] Open POL Master page
- [ ] Click "Add POL Port" button
- [ ] Fill in all required fields
- [ ] Submit form
- [ ] Verify success message
- [ ] Verify new port appears in table

**Update POL Port:**
- [ ] Click edit button on existing port
- [ ] Modify some fields
- [ ] Submit form
- [ ] Verify success message
- [ ] Verify changes reflected in table

**Delete POL Port:**
- [ ] Click delete button on existing port
- [ ] Verify delete confirmation modal appears
- [ ] Confirm deletion
- [ ] Verify success message
- [ ] Verify port removed from table

**Search and Filter:**
- [ ] Enter search term in search box
- [ ] Verify real-time filtering
- [ ] Test search by code, name, country, city
- [ ] Verify empty state when no results

**Export:**
- [ ] Click export button
- [ ] Verify CSV file downloads
- [ ] Verify file contains correct data
- [ ] Verify filename includes date

**Pagination:**
- [ ] Navigate between pages
- [ ] Verify page numbers update
- [ ] Verify correct data loads per page

### 2. API Testing

All endpoints can be tested using the browser's developer tools network tab or API testing tools like Postman:

```bash
# Create POL
POST /api/master-data/v1/pol
Content-Type: application/json
{
  "name": "Shanghai Port",
  "code": "CNSHA",
  "country": "China",
  "city": "Shanghai",
  "timezone": "UTC+08:00",
  "is_active": true
}

# List POLs with filters
POST /api/master-data/v1/pol/list
Content-Type: application/json
{
  "country": "China",
  "page": 1,
  "page_size": 10,
  "order_by": "name",
  "order_type": "asc"
}

# Update POL
PUT /api/master-data/v1/pol/1
Content-Type: application/json
{
  "name": "Shanghai Port Updated",
  "is_active": false
}

# Delete POL
DELETE /api/master-data/v1/pol/1
```

## Integration Benefits

1. **Consistency:** All POL operations follow the same patterns as other entities in the application
2. **Reusability:** Uses existing UI components (forms, modals, tables)
3. **Performance:** RTK Query provides automatic caching and optimized refetching
4. **Type Safety:** Full TypeScript support with comprehensive interfaces
5. **Error Handling:** Consistent error handling across all operations
6. **User Experience:** Smooth, responsive UI with proper loading states
7. **Maintainability:** Well-structured code following established patterns

## Migration Notes

If migrating from the previous mock data implementation:

1. **Data Structure Changes:**
   - Added `city` and `timezone` fields
   - Changed `isActive` to `is_active`
   - Added `created_on`, `modified_on` timestamps
   - Changed `region` to `city` (more specific)

2. **API Changes:**
   - All operations now use real API endpoints
   - List operation uses POST instead of GET
   - Comprehensive filtering options available

3. **State Management:**
   - Moved from local component state to Redux
   - Added RTK Query for caching
   - Proper error and loading states

## Support and Troubleshooting

### Common Issues:

1. **"Failed to fetch POL ports"**
   - Check network connectivity
   - Verify API endpoints are accessible
   - Check browser console for detailed errors

2. **Form validation errors**
   - Ensure all required fields are filled
   - Verify timezone format is correct
   - Check for duplicate port codes

3. **Export not working**
   - Check browser download settings
   - Verify export permissions
   - Ensure data is available to export

### Debug Information:

Enable Redux DevTools to monitor state changes and API calls. Network tab in browser DevTools shows all API requests and responses.

For questions or issues, refer to:
- Service implementation: `app/src/services/polService.ts`
- Redux slice: `app/src/store/slices/polSlice.ts`
- RTK Query: `app/src/store/api/apiSlice.ts`
- UI Component: `app/src/app/(admin)/admin/port-customer-master/pol-ports/POLPortsClient.tsx`
- Form Component: `app/src/components/forms/PortForm.tsx`

## Conclusion

The POL API integration is now complete and fully functional. All CRUD operations are implemented with proper error handling, loading states, and user feedback. The integration follows established patterns in the codebase and provides a solid foundation for future enhancements.
