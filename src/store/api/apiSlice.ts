import { createApi } from '@reduxjs/toolkit/query/react';
import { RootState } from '../index';
import superAxios from '@/utils/superAxios';
import {
  CreateUserRequest,
  UserResponse,
  UserDetailResponse,
  UserShortInfo,
  UserListResponse,
  UserListParams,
  SuperuserModifyRequest,
  SuperuserModifyResponse,
  CreateRoleRequest,
  RoleResponse,
  RoleListResponse,
  RoleListParams,
  RoleListRequest,
  RoleListResponseV2,
  // CreatePOLRequest, // Removed
  // UpdatePOLRequest, // Removed
  // POLResponse, // Removed
  // POLListRequest, // Removed
  // POLListResponse, // Removed
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerResponse,
  CustomerListRequest,
  CustomerListResponse,
  CreateContainerTypeRequest,
  UpdateContainerTypeRequest,
  ContainerTypeResponse,
  ContainerTypeListRequest,
  ContainerTypeListResponse,
  Privilege,
  PrivilegeListResponse,
  RoleUserResponse,
  ApiResponse,
  UserProfileResponse
} from '@/types/api';

// Simple base query that directly uses superAxios
const axiosBaseQuery = () => async (args: any) => {
  try {
    const result = await superAxios(args);
    return { data: result.data };
  } catch (axiosError: any) {
    return {
      error: {
        status: axiosError.response?.status,
        data: axiosError.response?.data || axiosError.message,
      },
    };
  }
};

// Define the API slice
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  
  // Define tag types for cache invalidation
  tagTypes: ['User', 'Role', 'Privilege', 'Customer', 'ContainerType'], // 'POL' removed
  
  endpoints: (builder) => ({
    // === USER MANAGEMENT ENDPOINTS ===
    
    // Get users list with filtering and pagination
    getUsers: builder.query<UserListResponse, UserListParams>({
      query: (params = {}) => ({
        url: '/user/v1/list',
        params: cleanParams(params),
      }),
      providesTags: ['User'],
    }),
    
    // Get single user by ID
    getUser: builder.query<UserDetailResponse, number>({
      query: (id) => `/user/v1/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    
    // Get user details
    getUserDetail: builder.query<UserDetailResponse, number>({
      query: (id) => `/user/v1/detail/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    
    // Get user short info
    getUserShortInfo: builder.query<UserShortInfo, number>({
      query: (id) => `/user/v1/short-info/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    
    // Create new user
    createUser: builder.mutation<UserResponse, CreateUserRequest>({
      query: (userData) => ({
        url: '/user/v1',
        method: 'POST',
        data: userData,
      }),
      invalidatesTags: ['User'],
    }),
    
    // Update user
    updateUser: builder.mutation<UserDetailResponse, { id: number; data: Partial<CreateUserRequest> }>({
      query: ({ id, data }) => ({
        url: `/user/v1/${id}`,
        method: 'PUT',
        data: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }, 'User'],
    }),
    
    // Delete user
    deleteUser: builder.mutation<ApiResponse, number>({
      query: (id) => ({
        url: `/user/v1/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    
    // Modify superuser status
    modifySuperuserStatus: builder.mutation<SuperuserModifyResponse, { id: number; data: SuperuserModifyRequest }>({
      query: ({ id, data }) => ({
        url: `/user/v1/superuser/modify/${id}`,
        method: 'PUT',
        data: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }],
    }),
    
    // Bulk update user status
    bulkUpdateUserStatus: builder.mutation<ApiResponse, { userIds: number[]; status: boolean }>({
      query: ({ userIds, status }) => ({
        url: '/user/v1/bulk-status',
        method: 'PUT',
        data: { user_ids: userIds, status },
      }),
      invalidatesTags: ['User'],
    }),
    
    // === ROLE MANAGEMENT ENDPOINTS ===
    
    // Get roles list with filtering and pagination using POST
    getRoles: builder.query<RoleListResponseV2[], RoleListRequest>({
      query: (params = {}) => ({
        url: '/admin/v1/role/list',
        method: 'POST',
        data: cleanParams(params),
      }),
      providesTags: ['Role'],
    }),
    
    // Get single role by ID
    getRole: builder.query<RoleResponse, number>({
      query: (id) => `/admin/v1/role/${id}`,
      providesTags: (result, error, id) => [{ type: 'Role', id }],
    }),
    
    // Create new role
    createRole: builder.mutation<RoleResponse, CreateRoleRequest>({
      query: (roleData) => ({
        url: '/admin/v1/role',
        method: 'POST',
        data: roleData,
      }),
      invalidatesTags: ['Role'],
    }),
    
    // Update role
    updateRole: builder.mutation<RoleResponse, { id: number; data: Partial<CreateRoleRequest> }>({
      query: ({ id, data }) => ({
        url: `/admin/v1/role/${id}`,
        method: 'PUT',
        data: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Role', id }, 'Role'],
    }),
    
    // Delete role
    deleteRole: builder.mutation<ApiResponse, number>({
      query: (id) => ({
        url: `/admin/v1/role/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Role'],
    }),
    
    // Get all privileges
    getPrivileges: builder.query<PrivilegeListResponse, void>({
      query: () => '/admin/v1/privilege/list',
      providesTags: ['Privilege'],
    }),
    
    // Get role users
    getRoleUsers: builder.query<RoleUserResponse, number>({
      query: (roleId) => ({
        url: '/admin/v1/role/user',
        params: { role_id: roleId },
      }),
      providesTags: (result, error, roleId) => [{ type: 'Role', id: roleId }],
    }),
    
    // Assign privileges to role
    assignPrivilegesToRole: builder.mutation<ApiResponse, { roleId: number; privilegeIds: number[] }>({
      query: ({ roleId, privilegeIds }) => ({
        url: `/admin/v1/role/${roleId}/privileges`,
        method: 'PUT',
        data: { privilege_ids: privilegeIds },
      }),
      invalidatesTags: (result, error, { roleId }) => [{ type: 'Role', id: roleId }],
    }),
    
    // Remove privileges from role
    removePrivilegesFromRole: builder.mutation<ApiResponse, { roleId: number; privilegeIds: number[] }>({
      query: ({ roleId, privilegeIds }) => ({
        url: `/admin/v1/role/${roleId}/privileges`,
        method: 'DELETE',
        data: { privilege_ids: privilegeIds },
      }),
      invalidatesTags: (result, error, { roleId }) => [{ type: 'Role', id: roleId }],
    }),
    
    // Bulk update role status
    bulkUpdateRoleStatus: builder.mutation<ApiResponse, { roleIds: number[]; isActive: boolean }>({
      query: ({ roleIds, isActive }) => ({
        url: '/admin/v1/role/bulk-status',
        method: 'PUT',
        data: { role_ids: roleIds, is_active: isActive },
      }),
      invalidatesTags: ['Role'],
    }),
    
    // Get role statistics
    getRoleStatistics: builder.query<ApiResponse, void>({
      query: () => '/admin/v1/role/statistics',
      providesTags: ['Role'],
    }),
    
    // === POL MANAGEMENT ENDPOINTS ===
    // All POL endpoints removed - now using direct service calls
    
    // === CUSTOMER MANAGEMENT ENDPOINTS ===
    
    // Get customers list with filtering and pagination using POST
    getCustomers: builder.query<CustomerListResponse, CustomerListRequest>({
      query: (params = {}) => ({
        url: '/master-data/v1/customer/list',
        method: 'POST',
        data: cleanParams(params),
      }),
      providesTags: ['Customer'],
    }),
    
    // Get single customer by ID
    getCustomer: builder.query<CustomerResponse, number>({
      query: (id) => `/master-data/v1/customer/${id}`,
      providesTags: (result, error, id) => [{ type: 'Customer', id }],
    }),
    
    // Create new customer
    createCustomer: builder.mutation<CustomerResponse, CreateCustomerRequest>({
      query: (customerData) => ({
        url: '/master-data/v1/customer',
        method: 'POST',
        data: customerData,
      }),
      invalidatesTags: ['Customer'],
    }),
    
    // Update customer
    updateCustomer: builder.mutation<CustomerResponse, { id: number; data: UpdateCustomerRequest }>({
      query: ({ id, data }) => ({
        url: `/master-data/v1/customer/${id}`,
        method: 'PUT',
        data: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Customer', id }, 'Customer'],
    }),
    
    // Patch customer
    patchCustomer: builder.mutation<CustomerResponse, { id: number; data: UpdateCustomerRequest }>({
      query: ({ id, data }) => ({
        url: `/master-data/v1/customer/${id}`,
        method: 'PATCH',
        data: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Customer', id }, 'Customer'],
    }),
    
    // Delete customer
    deleteCustomer: builder.mutation<ApiResponse, number>({
      query: (id) => ({
        url: `/master-data/v1/customer/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customer'],
    }),
    
    // Search customers
    searchCustomers: builder.query<CustomerResponse[], string>({
      query: (query) => ({
        url: '/master-data/v1/customer/list',
        method: 'POST',
        data: { name: query, page_size: 10 },
      }),
      providesTags: ['Customer'],
    }),
    
    // Get customers by country
    getCustomersByCountry: builder.query<CustomerListResponse, { country: string; params?: Omit<CustomerListRequest, 'country'> }>({
      query: ({ country, params = {} }) => ({
        url: '/master-data/v1/customer/list',
        method: 'POST',
        data: cleanParams({ ...params, country }),
      }),
      providesTags: ['Customer'],
    }),
    
        // Get customers by city
    getCustomersByCity: builder.query<CustomerListResponse, { city: string; params?: Omit<CustomerListRequest, 'city'> }>({
      query: ({ city, params = {} }) => ({
        url: '/master-data/v1/customer/list',
        method: 'POST',
        data: cleanParams({ ...params, city }),
      }),
      providesTags: ['Customer'],
    }),

    // === CONTAINER TYPE MANAGEMENT ENDPOINTS ===

    // Get container types list with filtering and pagination using POST
    getContainerTypes: builder.query<ContainerTypeListResponse, ContainerTypeListRequest>({
      query: (params = {}) => ({
        url: '/master-data/v1/container/list',
        method: 'POST',
        data: cleanParams(params),
      }),
      providesTags: ['ContainerType'],
    }),

    // Get single container type by ID
    getContainerType: builder.query<ContainerTypeResponse, number>({
      query: (id) => `/master-data/v1/container/${id}`,
      providesTags: (result, error, id) => [{ type: 'ContainerType', id }],
    }),

    // Create new container type
    createContainerType: builder.mutation<ContainerTypeResponse, CreateContainerTypeRequest>({
      query: (containerTypeData) => ({
        url: '/master-data/v1/container',
        method: 'POST',
        data: containerTypeData,
      }),
      invalidatesTags: ['ContainerType'],
    }),

    // Update container type
    updateContainerType: builder.mutation<ContainerTypeResponse, { id: number; data: UpdateContainerTypeRequest }>({
      query: ({ id, data }) => ({
        url: `/master-data/v1/container/${id}`,
        method: 'PUT',
        data: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ContainerType', id }, 'ContainerType'],
    }),

    // Patch container type
    patchContainerType: builder.mutation<ContainerTypeResponse, { id: number; data: UpdateContainerTypeRequest }>({
      query: ({ id, data }) => ({
        url: `/master-data/v1/container/${id}`,
        method: 'PATCH',
        data: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ContainerType', id }, 'ContainerType'],
    }),

    // Delete container type
    deleteContainerType: builder.mutation<ApiResponse, number>({
      query: (id) => ({
        url: `/master-data/v1/container/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ContainerType'],
    }),

    // Search container types
    searchContainerTypes: builder.query<ContainerTypeResponse[], string>({
      query: (query) => ({
        url: '/master-data/v1/container/list',
        method: 'POST',
        data: { name: query, page_size: 10 },
      }),
      providesTags: ['ContainerType'],
    }),

    // Get container types by status
    getContainerTypesByStatus: builder.query<ContainerTypeListResponse, { status: boolean; params?: Omit<ContainerTypeListRequest, 'status'> }>({
      query: ({ status, params = {} }) => ({
        url: '/master-data/v1/container/list',
        method: 'POST',
        data: cleanParams({ ...params, status }),
      }),
      providesTags: ['ContainerType'],
    }),

    // === USER PROFILE ENDPOINTS ===
    
    // Get current user profile
    getUserProfile: builder.query<UserProfileResponse, void>({
      query: () => ({
        url: '/user/v1/profile',
        method: 'GET',
      }),
      providesTags: ['User'],
    }),
    
    // Update current user profile
    updateUserProfile: builder.mutation<UserProfileResponse, Partial<CreateUserRequest>>({
      query: (profileData) => ({
        url: '/user/v1/profile',
        method: 'PUT',
        data: profileData,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

// Utility function to clean parameters
function cleanParams(params: Record<string, any>): Record<string, any> {
  console.log('🧹 Cleaning params:', params);
  const cleanedParams: Record<string, any> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleanedParams[key] = value;
    }
  });
  
  console.log('✨ Cleaned params:', cleanedParams);
  return cleanedParams;
}

// Export hooks for components to use
export const {
  // User management hooks
  useGetUsersQuery,
  useGetUserQuery,
  useGetUserDetailQuery,
  useGetUserShortInfoQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useModifySuperuserStatusMutation,
  useBulkUpdateUserStatusMutation,
  
  // Role management hooks
  useGetRolesQuery,
  useGetRoleQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetPrivilegesQuery,
  useGetRoleUsersQuery,
  useAssignPrivilegesToRoleMutation,
  useRemovePrivilegesFromRoleMutation,
  useBulkUpdateRoleStatusMutation,
  useGetRoleStatisticsQuery,
  
  // POL management hooks - removed, now using direct service calls
  
  // Customer management hooks
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  usePatchCustomerMutation,
  useDeleteCustomerMutation,
  useSearchCustomersQuery,
  useGetCustomersByCountryQuery,
  useGetCustomersByCityQuery,
  
  // Container Type management hooks
  useGetContainerTypesQuery,
  useGetContainerTypeQuery,
  useCreateContainerTypeMutation,
  useUpdateContainerTypeMutation,
  usePatchContainerTypeMutation,
  useDeleteContainerTypeMutation,
  useSearchContainerTypesQuery,
  useGetContainerTypesByStatusQuery,
  
  // User profile hooks
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
} = apiSlice;
