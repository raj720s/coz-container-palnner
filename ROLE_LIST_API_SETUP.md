# Role List API Setup Documentation

## Overview
This document describes the complete setup for the Role List API endpoint `POST /api/admin/v1/role/list` which provides comprehensive filtering, pagination, and export capabilities for role management.

## API Endpoint Details

**Endpoint:** `POST /api/admin/v1/role/list`  
**Method:** POST  
**Content-Type:** `application/json`

### Request Body Schema
```typescript
interface RoleListRequest {
  role_name?: string;                    // Filter by role name
  role_description?: string;             // Filter by role description
  include_privilege_data?: boolean;      // Include privilege information
  order_by?: string;                     // Field to order by (e.g., 'created_on', 'role_name')
  created_by?: number;                   // Filter by creator ID
  created_on_start_date?: string;        // Start date for creation filter (ISO string)
  created_on_end_date?: string;          // End date for creation filter (ISO string)
  modified_on_start_date?: string;       // Start date for modification filter (ISO string)
  modified_on_end_date?: string;         // End date for modification filter (ISO string)
  created_by_name?: string;              // Filter by creator name
  modified_by?: number;                  // Filter by modifier ID
  modified_by_name?: string;             // Filter by modifier name
  export?: boolean;                      // Export flag for bulk operations
  module_id?: number;                    // Filter by module ID
  order_type?: string;                   // Order direction ('asc' or 'desc')
  page?: number;                         // Page number for pagination
  page_size?: number;                    // Number of items per page
}
```

### Response Schema
```typescript
interface RoleListResponseV2 {
  id: number;                            // Role ID
  role_name: string;                     // Role name
  role_description: string;              // Role description
  privilege_names: string;               // Comma-separated privilege names
  modified_on: string;                   // Last modification timestamp
  modified_by: number;                   // ID of user who last modified
  created_on: string;                    // Creation timestamp
  created_by: number;                    // ID of user who created
}
```

## Implementation Components

### 1. Service Layer (`app/src/services/roleService.ts`)

The service provides two methods for fetching roles:

```typescript
// Legacy method (maintains backward compatibility)
async getRoles(params: RoleListParams = {}): Promise<RoleListResponse>

// New comprehensive method
async getRolesV2(params: RoleListRequest = {}): Promise<RoleListResponseV2[]>
```

**Usage Example:**
```typescript
import { roleService } from '@/services';

// Basic usage
const roles = await roleService.getRolesV2({
  page: 1,
  page_size: 10,
  order_by: 'created_on',
  order_type: 'desc'
});

// Advanced filtering
const filteredRoles = await roleService.getRolesV2({
  role_name: 'admin',
  include_privilege_data: true,
  created_on_start_date: '2024-01-01T00:00:00.000Z',
  created_on_end_date: '2024-12-31T23:59:59.999Z',
  export: false
});
```

### 2. Redux Store (`app/src/store/slices/roleSlice.ts`)

The Redux slice provides async thunks for state management:

```typescript
// Fetch roles with comprehensive filtering
export const fetchRolesV2 = createAsyncThunk(
  'roles/fetchRolesV2',
  async (params: RoleListRequest = {}, { rejectWithValue }) => {
    try {
      const response = await roleService.getRolesV2(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch roles');
    }
  }
);
```

**Usage Example:**
```typescript
import { useDispatch, useSelector } from 'react-redux';
import { fetchRolesV2, selectRolesV2 } from '@/store/slices/roleSlice';

const dispatch = useDispatch();
const roles = useSelector(selectRolesV2);

// Fetch roles
dispatch(fetchRolesV2({
  page: 1,
  page_size: 20,
  role_name: 'user'
}));
```

### 3. RTK Query (`app/src/store/api/apiSlice.ts`)

RTK Query provides automatic caching and synchronization:

```typescript
// Get roles list with filtering and pagination using POST
getRoles: builder.query<RoleListResponseV2[], RoleListRequest>({
  query: (params = {}) => ({
    url: '/admin/v1/role/list',
    method: 'POST',
    data: cleanParams(params),
  }),
  providesTags: ['Role'],
}),
```

**Usage Example:**
```typescript
import { useGetRolesQuery } from '@/store/api/apiSlice';

const { data: roles, isLoading, error, refetch } = useGetRolesQuery({
  page: 1,
  page_size: 10,
  order_by: 'role_name',
  order_type: 'asc'
});
```

## Complete Usage Examples

### Example 1: Basic Role List with Pagination
```typescript
import React, { useState } from 'react';
import { useGetRolesQuery } from '@/store/api/apiSlice';

const RoleList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const { data: roles, isLoading, error } = useGetRolesQuery({
    page,
    page_size: pageSize,
    order_by: 'created_on',
    order_type: 'desc'
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {roles?.map(role => (
        <div key={role.id}>
          <h3>{role.role_name}</h3>
          <p>{role.role_description}</p>
        </div>
      ))}
    </div>
  );
};
```

### Example 2: Advanced Filtering and Search
```typescript
import React, { useState, useEffect } from 'react';
import { roleService } from '@/services';

const AdvancedRoleSearch: React.FC = () => {
  const [filters, setFilters] = useState({
    role_name: '',
    include_privilege_data: true,
    created_on_start_date: '',
    created_on_end_date: '',
    order_by: 'created_on',
    order_type: 'desc' as const
  });
  
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchRoles = async () => {
    setLoading(true);
    try {
      const results = await roleService.getRolesV2(filters);
      setRoles(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Role name"
        value={filters.role_name}
        onChange={(e) => setFilters({ ...filters, role_name: e.target.value })}
      />
      <button onClick={searchRoles} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      
      {roles.map(role => (
        <div key={role.id}>
          <h3>{role.role_name}</h3>
          <p>Privileges: {role.privilege_names}</p>
        </div>
      ))}
    </div>
  );
};
```

### Example 3: Export Functionality
```typescript
import { roleService } from '@/services';

const exportRoles = async () => {
  try {
    const exportData = await roleService.getRolesV2({
      export: true,
      page_size: 1000, // Get all roles
      include_privilege_data: true,
      order_by: 'role_name',
      order_type: 'asc'
    });
    
    // Convert to CSV or trigger download
    const csvContent = convertToCSV(exportData);
    downloadCSV(csvContent, 'roles_export.csv');
  } catch (error) {
    console.error('Export failed:', error);
  }
};
```

## Error Handling

The service layer includes comprehensive error handling:

```typescript
try {
  const roles = await roleService.getRolesV2(params);
  // Handle success
} catch (error) {
  if (error.response?.status === 400) {
    // Handle validation errors
    console.error('Validation error:', error.response.data);
  } else if (error.response?.status === 401) {
    // Handle authentication errors
    console.error('Authentication required');
  } else if (error.response?.status === 403) {
    // Handle authorization errors
    console.error('Insufficient permissions');
  } else {
    // Handle other errors
    console.error('Unexpected error:', error.message);
  }
}
```

## Best Practices

1. **Use RTK Query for UI components** - Provides automatic caching, loading states, and error handling
2. **Use service directly for programmatic calls** - When you need more control over the request
3. **Implement proper error boundaries** - Handle API errors gracefully in your UI
4. **Use TypeScript interfaces** - Ensure type safety for request/response data
5. **Implement loading states** - Show appropriate loading indicators during API calls
6. **Cache responses appropriately** - Use RTK Query's built-in caching or implement custom caching logic

## Testing

The API can be tested using the demo component at `app/src/components/user/AccessControlDisplay.tsx` which demonstrates all three approaches:

1. Redux slice with async thunk
2. RTK Query hook
3. Direct service call

## Migration Guide

If you're migrating from the old GET-based API:

1. **Update imports** - Use new types from `@/types/api`
2. **Change method calls** - Use `getRolesV2` instead of `getRoles`
3. **Update request structure** - Use `RoleListRequest` interface
4. **Handle new response format** - Use `RoleListResponseV2` interface
5. **Update error handling** - Ensure proper error handling for new response format

## Support

For questions or issues with the Role List API implementation, refer to:
- Service layer: `app/src/services/roleService.ts`
- Redux slice: `app/src/store/slices/roleSlice.ts`
- RTK Query: `app/src/store/api/apiSlice.ts`
- Demo component: `app/src/components/user/AccessControlDisplay.tsx`
