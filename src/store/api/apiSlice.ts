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
  CreatePOLRequest,
  UpdatePOLRequest,
  POLResponse,
  POLListRequest,
  POLListResponse,
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
  tagTypes: ['User', 'Role', 'Privilege', 'POL'],
  
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
    
    // Get POLs list with filtering and pagination using POST
    getPOLs: builder.query<POLListResponse, POLListRequest>({
      query: (params = {}) => ({
        url: '/master-data/v1/pol/list',
        method: 'POST',
        data: cleanParams(params),
      }),
      providesTags: ['POL'],
    }),
    
    // Get single POL by ID
    getPOL: builder.query<POLResponse, number>({
      query: (id) => `/master-data/v1/pol/${id}`,
      providesTags: (result, error, id) => [{ type: 'POL', id }],
    }),
    
    // Create new POL
    createPOL: builder.mutation<POLResponse, CreatePOLRequest>({
      query: (polData) => ({
        url: '/master-data/v1/pol',
        method: 'POST',
        data: polData,
      }),
      invalidatesTags: ['POL'],
    }),
    
    // Update POL
    updatePOL: builder.mutation<POLResponse, { id: number; data: UpdatePOLRequest }>({
      query: ({ id, data }) => ({
        url: `/master-data/v1/pol/${id}`,
        method: 'PUT',
        data: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'POL', id }, 'POL'],
    }),
    
    // Delete POL
    deletePOL: builder.mutation<ApiResponse, number>({
      query: (id) => ({
        url: `/master-data/v1/pol/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['POL'],
    }),
    
    // Search POLs
    searchPOLs: builder.query<POLResponse[], string>({
      query: (query) => ({
        url: '/master-data/v1/pol/list',
        method: 'POST',
        data: { name: query, page_size: 10 },
      }),
      providesTags: ['POL'],
    }),
    
    // Get POLs by country
    getPOLsByCountry: builder.query<POLListResponse, { country: string; params?: Omit<POLListRequest, 'country'> }>({
      query: ({ country, params = {} }) => ({
        url: '/master-data/v1/pol/list',
        method: 'POST',
        data: cleanParams({ ...params, country }),
      }),
      providesTags: ['POL'],
    }),
    
    // Get POLs by city
    getPOLsByCity: builder.query<POLListResponse, { city: string; params?: Omit<POLListRequest, 'city'> }>({
      query: ({ city, params = {} }) => ({
        url: '/master-data/v1/pol/list',
        method: 'POST',
        data: cleanParams({ ...params, city }),
      }),
      providesTags: ['POL'],
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
  const cleanedParams: Record<string, any> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleanedParams[key] = value;
    }
  });
  
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
  
  // POL management hooks
  useGetPOLsQuery,
  useGetPOLQuery,
  useCreatePOLMutation,
  useUpdatePOLMutation,
  useDeletePOLMutation,
  useSearchPOLsQuery,
  useGetPOLsByCountryQuery,
  useGetPOLsByCityQuery,
  
  // User profile hooks
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
} = apiSlice;
