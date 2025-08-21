import { BaseService } from './baseService';
import {
  CreateUserRequest,
  UserResponse,
  UserDetailResponse,
  UserShortInfo,
  UserListResponse,
  UserListParams,
  SuperuserModifyRequest,
  SuperuserModifyResponse,
  ApiResponse,
  UserListResponseV2
} from '@/types/api';

class UserService extends BaseService {
  protected readonly basePath = '/user/v1';

  /**
   * Create a new user
   * @param userData - User creation data
   * @returns Promise<UserResponse>
   */
  async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    console.log('🚀 UserService.createUser called with data:', userData);
    console.log('🌐 Making POST request to endpoint: /user/v1');
    
    this.validateRequiredFields(userData, ['first_name', 'last_name', 'email', 'organisation_name', 'role']);
    
    try {
      const result = await this.post<UserResponse>('/user/v1', userData);
      console.log('✅ UserService.createUser success:', result);
      return result;
    } catch (error) {
      console.error('❌ UserService.createUser error:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param id - User ID
   * @returns Promise<UserDetailResponse>
   */
  async getUser(id: number): Promise<UserDetailResponse> {
    return this.get<UserDetailResponse>(this.buildEndpoint(id));
  }

  /**
   * Update user by ID
   * @param id - User ID
   * @param userData - Partial user data to update
   * @returns Promise<UserDetailResponse>
   */
  async updateUser(id: number, userData: Partial<CreateUserRequest>): Promise<UserDetailResponse> {
    return this.put<UserDetailResponse>(this.buildEndpoint(id), userData);
  }

  /**
   * Delete user by ID
   * @param id - User ID
   * @returns Promise<ApiResponse>
   */
  async deleteUser(id: number): Promise<ApiResponse> {
    return this.delete<ApiResponse>(this.buildEndpoint(id));
  }

  /**
   * Get list of users with filtering and pagination
   * @param params - Query parameters for filtering and pagination
   * @returns Promise<UserListResponseV2>
   */
  async getUsers(params: UserListParams = {}): Promise<UserListResponseV2> {
    // Convert params to match the new API structure
    const requestBody = {
      email: params.email || undefined,
      is_superuser: params.is_superuser || undefined,
      first_name: params.first_name || undefined,
      last_name: params.last_name || undefined,
      organisation_name: params.organisation_name || undefined,
      country_code: params.country_code || undefined,
      phone_number: params.phone_number || undefined,
      order_by: params.order_by || undefined,
      order_type: params.order_type || undefined,
      created_on_start_date: params.created_on_start_date || undefined,
      created_on_end_date: params.created_on_end_date || undefined,
      created_by: params.created_by || undefined,
      created_by_name: params.created_by_name || undefined,
      modified_on_start_date: params.modified_on_start_date || undefined,
      modified_on_end_date: params.modified_on_end_date || undefined,
      last_login_start_date: params.last_login_start_date || undefined,
      last_login_end_date: params.last_login_end_date || undefined,
      modified_by: params.modified_by || undefined,
      modified_by_name: params.modified_by_name || undefined,
      page: params.page || 1,
      page_size: params.page_size || 10,
      status: params.status || undefined,
      role_name: params.role_name || undefined,
      export: params.export || false,
    };
    
    return this.post<UserListResponseV2>(this.buildEndpoint('list'), requestBody);
  }

  /**
   * Get detailed user information
   * @param id - User ID
   * @returns Promise<UserDetailResponse>
   */
  async getUserDetail(id: number): Promise<UserDetailResponse> {
    return this.get<UserDetailResponse>(this.buildEndpoint('detail', id));
  }

  /**
   * Get short user information
   * @param id - User ID
   * @returns Promise<UserShortInfo>
   */
  async getUserShortInfo(id: number): Promise<UserShortInfo> {
    return this.get<UserShortInfo>(this.buildEndpoint('short-info', id));
  }

  /**
   * Modify superuser status
   * @param id - User ID
   * @param superuserData - Superuser modification data
   * @returns Promise<SuperuserModifyResponse>
   */
  async modifySuperuserStatus(id: number, superuserData: SuperuserModifyRequest): Promise<SuperuserModifyResponse> {
    return this.put<SuperuserModifyResponse>(this.buildEndpoint('superuser', 'modify', id), superuserData);
  }

  /**
   * Search users by email or name
   * @param query - Search query
   * @param limit - Maximum number of results
   * @returns Promise<UserShortInfo[]>
   */
  async searchUsers(query: string, limit: number = 10): Promise<UserShortInfo[]> {
    const response = await this.get<UserListResponse>(this.buildEndpoint('list'), { search: query, limit });
    return response.data;
  }

  /**
   * Get users by organization
   * @param organisationName - Organization name
   * @param params - Additional query parameters
   * @returns Promise<UserListResponse>
   */
  async getUsersByOrganization(organisationName: string, params: Omit<UserListParams, 'organisation'> = {}): Promise<UserListResponse> {
    const cleanParams = this.buildParams({ ...params, organisation: organisationName });
    return this.get<UserListResponse>(this.buildEndpoint('list'), cleanParams);
  }

  /**
   * Get users by role
   * @param roleId - Role ID
   * @param params - Additional query parameters
   * @returns Promise<UserListResponse>
   */
  async getUsersByRole(roleId: number, params: Omit<UserListParams, 'role'> = {}): Promise<UserListResponse> {
    const cleanParams = this.buildParams({ ...params, role: roleId });
    return this.get<UserListResponse>(this.buildEndpoint('list'), cleanParams);
  }

  /**
   * Bulk update user status
   * @param userIds - Array of user IDs
   * @param status - New status
   * @returns Promise<ApiResponse>
   */
  async bulkUpdateUserStatus(userIds: number[], status: boolean): Promise<ApiResponse> {
    return this.put<ApiResponse>(this.buildEndpoint('bulk-status'), {
      user_ids: userIds,
      status
    });
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;
