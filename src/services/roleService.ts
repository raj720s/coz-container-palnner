import { BaseService } from './baseService';
import {
  CreateRoleRequest,
  RoleResponse,
  RoleListResponse,
  RoleListParams,
  Privilege,
  PrivilegeListResponse,
  RoleUserResponse,
  ApiResponse
} from '@/types/api';

class RoleService extends BaseService {
  protected readonly basePath = '/admin/v1/role';

  /**
   * Create a new role
   * @param roleData - Role creation data
   * @returns Promise<RoleResponse>
   */
  async createRole(roleData: CreateRoleRequest): Promise<RoleResponse> {
    this.validateRequiredFields(roleData, ['name', 'privileges']);
    return this.post<RoleResponse>(this.basePath, roleData);
  }

  /**
   * Get role by ID
   * @param id - Role ID
   * @returns Promise<RoleResponse>
   */
  async getRole(id: number): Promise<RoleResponse> {
    return this.get<RoleResponse>(this.buildEndpoint(id));
  }

  /**
   * Update role by ID
   * @param id - Role ID
   * @param roleData - Partial role data to update
   * @returns Promise<RoleResponse>
   */
  async updateRole(id: number, roleData: Partial<CreateRoleRequest>): Promise<RoleResponse> {
    return this.put<RoleResponse>(this.buildEndpoint(id), roleData);
  }

  /**
   * Delete role by ID
   * @param id - Role ID
   * @returns Promise<ApiResponse>
   */
  async deleteRole(id: number): Promise<ApiResponse> {
    return this.delete<ApiResponse>(this.buildEndpoint(id));
  }

  /**
   * Get list of roles with filtering and pagination
   * @param params - Query parameters for filtering and pagination
   * @returns Promise<RoleListResponse>
   */
  async getRoles(params: RoleListParams = {}): Promise<RoleListResponse> {
    const cleanParams = this.buildParams(params);
    return this.get<RoleListResponse>(this.buildEndpoint('list'), cleanParams);
  }

  /**
   * Get all privileges list
   * @returns Promise<PrivilegeListResponse>
   */
  async getPrivileges(): Promise<PrivilegeListResponse> {
    return this.get<PrivilegeListResponse>('/admin/v1/privilege/list');
  }

  /**
   * Get role and users assigned to it
   * @param roleId - Role ID
   * @returns Promise<RoleUserResponse>
   */
  async getRoleUsers(roleId: number): Promise<RoleUserResponse> {
    return this.get<RoleUserResponse>('/admin/v1/role/user', { role_id: roleId });
  }

  /**
   * Search roles by name
   * @param query - Search query
   * @param limit - Maximum number of results
   * @returns Promise<RoleResponse[]>
   */
  async searchRoles(query: string, limit: number = 10): Promise<RoleResponse[]> {
    const response = await this.get<RoleListResponse>(this.buildEndpoint('list'), { search: query, limit });
    return response.data;
  }

  /**
   * Get active roles only
   * @param params - Additional query parameters
   * @returns Promise<RoleListResponse>
   */
  async getActiveRoles(params: Omit<RoleListParams, 'is_active'> = {}): Promise<RoleListResponse> {
    const cleanParams = this.buildParams({ ...params, is_active: true });
    return this.get<RoleListResponse>(this.buildEndpoint('list'), cleanParams);
  }

  /**
   * Get roles by privilege
   * @param privilegeId - Privilege ID
   * @param params - Additional query parameters
   * @returns Promise<RoleListResponse>
   */
  async getRolesByPrivilege(privilegeId: number, params: Omit<RoleListParams, 'privilege'> = {}): Promise<RoleListResponse> {
    const cleanParams = this.buildParams({ ...params, privilege: privilegeId });
    return this.get<RoleListResponse>(this.buildEndpoint('list'), cleanParams);
  }

  /**
   * Bulk update role status
   * @param roleIds - Array of role IDs
   * @param isActive - New active status
   * @returns Promise<ApiResponse>
   */
  async bulkUpdateRoleStatus(roleIds: number[], isActive: boolean): Promise<ApiResponse> {
    return this.put<ApiResponse>(this.buildEndpoint('bulk-status'), {
      role_ids: roleIds,
      is_active: isActive
    });
  }

  /**
   * Assign privileges to role
   * @param roleId - Role ID
   * @param privilegeIds - Array of privilege IDs
   * @returns Promise<ApiResponse>
   */
  async assignPrivilegesToRole(roleId: number, privilegeIds: number[]): Promise<ApiResponse> {
    return this.put<ApiResponse>(this.buildEndpoint(roleId, 'privileges'), {
      privilege_ids: privilegeIds
    });
  }

  /**
   * Remove privileges from role
   * @param roleId - Role ID
   * @param privilegeIds - Array of privilege IDs to remove
   * @returns Promise<ApiResponse>
   */
  async removePrivilegesFromRole(roleId: number, privilegeIds: number[]): Promise<ApiResponse> {
    return this.delete<ApiResponse>(this.buildEndpoint(roleId, 'privileges'), {
      privilege_ids: privilegeIds
    });
  }

  /**
   * Get role statistics
   * @returns Promise<ApiResponse>
   */
  async getRoleStatistics(): Promise<ApiResponse> {
    return this.get<ApiResponse>(this.buildEndpoint('statistics'));
  }
}

// Export singleton instance
export const roleService = new RoleService();
export default roleService;
