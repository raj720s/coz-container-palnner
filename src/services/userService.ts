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
  ApiResponse
} from '@/types/api';

class UserService extends BaseService {
  protected readonly basePath = '/user/v1';

  /**
   * Create a new user
   * @param userData - User creation data
   * @returns Promise<UserResponse>
   */
  async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    this.validateRequiredFields(userData, ['first_name', 'last_name', 'email', 'organisation_name', 'role']);
    return this.post<UserResponse>(this.basePath, userData);
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
   * @returns Promise<UserListResponse>
   */
  async getUsers(params: UserListParams = {}): Promise<UserListResponse> {
    const cleanParams = this.buildParams(params);
    return this.get<UserListResponse>(this.buildEndpoint('list'), cleanParams);
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
