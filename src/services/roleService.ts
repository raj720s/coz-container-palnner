import { BaseService } from './baseService';

// Role Management Types
export interface CreateRoleRequest {
  role_name: string;
  role_description: string;
  privilege_names: string[];
}

export interface UpdateRoleRequest {
  role_name?: string;
  role_description?: string;
  privilege_names?: string[];
}

export interface RoleResponse {
  id: string;
  role_name: string;
  role_description: string;
  privilege_names: string[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
  created_by?: number;
  modified_by?: number;
}

export interface RoleListResponse {
  count: number;
  results: RoleResponse[];
}

export interface RoleListParams {
  page?: number;
  page_size?: number;
  role_name?: string;
  role_description?: string;
  include_privilege_data?: boolean;
  order_by?: string;
  order_type?: string;
  created_by?: number;
  created_on_start_date?: string;
  created_on_end_date?: string;
  modified_on_start_date?: string;
  modified_on_end_date?: string;
  created_by_name?: string;
  modified_by?: number;
  modified_by_name?: string;
  export?: boolean;
  module_id?: number;
}

export interface PrivilegeItem {
  id: number;
  privilege_name: string;
  privilege_desc: string;
  module_id: string;
}

export interface PrivilegeResponse {
  count: number;
  results: PrivilegeItem[];
}

export interface PrivilegeListParams {
  privilege_name?: string;
  privilege_desc?: string;
  role_id?: number;
  order_by?: string;
  order_type?: string;
  page?: number;
  page_size?: number;
}

export interface RoleUserResponse {
  role_id: string;
  users: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>;
}

class RoleService extends BaseService {
  protected readonly basePath = '/admin/v1';

  /**
   * Create a new role
   * @param roleData - Role creation data
   * @returns Promise<RoleResponse>
   */
  async createRole(roleData: CreateRoleRequest): Promise<RoleResponse> {
    this.validateRequiredFields(roleData, ['role_name', 'role_description', 'privilege_names']);
    return this.post<RoleResponse>(this.buildEndpoint('role'), roleData);
  }

  /**
   * Get role by ID
   * @param id - Role ID
   * @returns Promise<RoleResponse>
   */
  async getRole(id: string): Promise<RoleResponse> {
    return this.get<RoleResponse>(this.buildEndpoint('role', id));
  }

  /**
   * Update role by ID
   * @param id - Role ID
   * @param roleData - Partial role data to update
   * @returns Promise<RoleResponse>
   */
  async updateRole(id: string, roleData: UpdateRoleRequest): Promise<RoleResponse> {
    return this.put<RoleResponse>(this.buildEndpoint('role', id), roleData);
  }

  /**
   * Delete role by ID
   * @param id - Role ID
   * @returns Promise<{ success: boolean }>
   */
  async deleteRole(id: string): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(this.buildEndpoint('role', id));
  }

  /**
   * Get list of roles with filtering and pagination
   * @param params - Query parameters for filtering and pagination
   * @returns Promise<RoleListResponse>
   */
  async getRoles(params: RoleListParams = {}): Promise<RoleListResponse> {
    const cleanParams = this.buildParams(params);
    return this.post<RoleListResponse>(this.buildEndpoint('role', 'list'), cleanParams);
  }

  /**
   * Get list of privileges with filtering and pagination
   * @param params - Query parameters for filtering and pagination
   * @returns Promise<PrivilegeResponse>
   */
  async getPrivileges(params: PrivilegeListParams = {}): Promise<PrivilegeResponse> {
    const cleanParams = this.buildParams(params);
    return this.post<PrivilegeResponse>('/admin/v1/privilege/list', cleanParams);
  }

  /**
   * Get privileges for a specific role
   * @param roleId - Role ID to get privileges for
   * @returns Promise<PrivilegeResponse>
   */
  async getPrivilegesByRole(roleId: number): Promise<PrivilegeResponse> {
    return this.post<PrivilegeResponse>('/admin/v1/privilege/list', {
      role_id: roleId,
      page: 1,
      page_size: 1000 // Get all privileges for the role
    });
  }

  /**
   * Get users assigned to a specific role
   * @param roleId - Role ID
   * @returns Promise<RoleUserResponse>
   */
  async getRoleUsers(roleId: string): Promise<RoleUserResponse> {
    return this.get<RoleUserResponse>(this.buildEndpoint('role', 'user'), { role_id: roleId });
  }

  /**
   * Search roles by name
   * @param query - Search query
   * @param limit - Maximum number of results
   * @returns Promise<RoleResponse[]>
   */
  async searchRoles(query: string, limit: number = 10): Promise<RoleResponse[]> {
    const response = await this.post<RoleListResponse>(this.buildEndpoint('role', 'list'), { 
      role_name: query, 
      page_size: limit 
    });
    return response.results;
  }

  /**
   * Get roles by privilege
   * @param privilegeName - Privilege name to search for
   * @param params - Additional query parameters
   * @returns Promise<RoleListResponse>
   */
  async getRolesByPrivilege(privilegeName: string, params: Omit<RoleListParams, 'privilege_name'> = {}): Promise<RoleListResponse> {
    const cleanParams = this.buildParams({ ...params, privilege_name: privilegeName });
    return this.post<RoleListResponse>(this.buildEndpoint('role', 'list'), cleanParams);
  }

  /**
   * Bulk update role status
   * @param roleIds - Array of role IDs
   * @param isActive - New status
   * @returns Promise<{ success: boolean }>
   */
  async bulkUpdateRoleStatus(roleIds: string[], isActive: boolean): Promise<{ success: boolean }> {
    return this.put<{ success: boolean }>(this.buildEndpoint('role', 'bulk-status'), {
      role_ids: roleIds,
      is_active: isActive
    });
  }

  /**
   * Clone role with new name
   * @param roleId - Role ID to clone
   * @param newRoleName - New role name
   * @param newRoleDescription - New role description
   * @returns Promise<RoleResponse>
   */
  async cloneRole(roleId: string, newRoleName: string, newRoleDescription: string): Promise<RoleResponse> {
    const originalRole = await this.getRole(roleId);
    return this.createRole({
      role_name: newRoleName,
      role_description: newRoleDescription,
      privilege_names: originalRole.privilege_names
    });
  }
}

// Export singleton instance
export const roleService = new RoleService();
export default roleService;
