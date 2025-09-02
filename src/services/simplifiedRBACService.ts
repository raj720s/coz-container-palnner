import superAxios from '@/utils/superAxios';
import { BaseService } from './baseService';

/**
 * Simplified RBAC Service - Routes and Privileges Only
 * Handles all RBAC-related API calls without module complexity
 */
export class SimplifiedRBACService extends BaseService {
  protected readonly basePath = '/admin/v1';

  /**
   * Get user information with privileges and accessible routes
   */
  async getUserInfo(): Promise<{
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role_id: number;
    role_name: string;
    is_superuser: boolean;
    privileges: Array<{
      id: number;
      privilege_name: string;
      resource_type: 'route' | 'action' | 'feature';
      resource_identifier: string;
    }>;
    accessible_routes: string[];
  }> {
    try {
      const response = await superAxios.get('/user/v1/info');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }

  /**
   * Get all roles with their privileges
   */
  async getRoles(): Promise<{
    count: number;
    results: Array<{
      id: number;
      role_name: string;
      role_description: string;
      privileges: Array<{
        id: number;
        privilege_name: string;
        resource_type: 'route' | 'action' | 'feature';
        resource_identifier: string;
      }>;
      created_at: string;
      updated_at: string;
    }>;
  }> {
    try {
      const response = await superAxios.get(this.buildEndpoint('roles'));
      return response.data;
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  /**
   * Create a new role
   */
  async createRole(roleData: {
    role_name: string;
    role_description: string;
    privileges: number[]; // Array of privilege IDs
  }): Promise<{
    id: number;
    role_name: string;
    role_description: string;
    privileges: Array<{
      id: number;
      privilege_name: string;
      resource_type: 'route' | 'action' | 'feature';
      resource_identifier: string;
    }>;
    created_at: string;
  }> {
    try {
      const response = await superAxios.post(this.buildEndpoint('roles'), roleData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Update an existing role
   */
  async updateRole(roleId: number, roleData: {
    role_name?: string;
    role_description?: string;
    privileges?: number[]; // Array of privilege IDs
  }): Promise<{
    id: number;
    role_name: string;
    role_description: string;
    privileges: Array<{
      id: number;
      privilege_name: string;
      resource_type: 'route' | 'action' | 'feature';
      resource_identifier: string;
    }>;
    updated_at: string;
  }> {
    try {
      const response = await superAxios.put(this.buildEndpoint(`roles/${roleId}`), roleData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating role:', error);
      throw error;
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: number): Promise<void> {
    try {
      await superAxios.delete(this.buildEndpoint(`roles/${roleId}`));
    } catch (error: any) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }

  /**
   * Get all privileges
   */
  async getPrivileges(): Promise<{
    count: number;
    results: Array<{
      id: number;
      privilege_name: string;
      privilege_description: string;
      resource_type: 'route' | 'action' | 'feature';
      resource_identifier: string;
      is_active: boolean;
    }>;
  }> {
    try {
      const response = await superAxios.get(this.buildEndpoint('privileges'));
      return response.data;
    } catch (error: any) {
      console.error('Error fetching privileges:', error);
      throw error;
    }
  }

  /**
   * Create a new privilege
   */
  async createPrivilege(privilegeData: {
    privilege_name: string;
    privilege_description: string;
    resource_type: 'route' | 'action' | 'feature';
    resource_identifier: string;
  }): Promise<{
    id: number;
    privilege_name: string;
    privilege_description: string;
    resource_type: 'route' | 'action' | 'feature';
    resource_identifier: string;
    is_active: boolean;
  }> {
    try {
      const response = await superAxios.post(this.buildEndpoint('privileges'), privilegeData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating privilege:', error);
      throw error;
    }
  }

  /**
   * Update an existing privilege
   */
  async updatePrivilege(privilegeId: number, privilegeData: {
    privilege_name?: string;
    privilege_description?: string;
    resource_type?: 'route' | 'action' | 'feature';
    resource_identifier?: string;
    is_active?: boolean;
  }): Promise<{
    id: number;
    privilege_name: string;
    privilege_description: string;
    resource_type: 'route' | 'action' | 'feature';
    resource_identifier: string;
    is_active: boolean;
  }> {
    try {
      const response = await superAxios.put(this.buildEndpoint(`privileges/${privilegeId}`), privilegeData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating privilege:', error);
      throw error;
    }
  }

  /**
   * Delete a privilege
   */
  async deletePrivilege(privilegeId: number): Promise<void> {
    try {
      await superAxios.delete(this.buildEndpoint(`privileges/${privilegeId}`));
    } catch (error: any) {
      console.error('Error deleting privilege:', error);
      throw error;
    }
  }

  /**
   * Get navigation structure for the current user
   */
  async getNavigation(): Promise<{
    navigation: Array<{
      name: string;
      path: string;
      icon: string;
      children: Array<{
        name: string;
        path: string;
        icon: string;
      }>;
    }>;
  }> {
    try {
      const response = await superAxios.get('/user/v1/navigation');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching navigation:', error);
      throw error;
    }
  }

  /**
   * Get all routes (optional - for route management)
   */
  async getRoutes(): Promise<{
    count: number;
    results: Array<{
      id: number;
      route_path: string;
      route_name: string;
      route_description: string;
      is_public: boolean;
      is_active: boolean;
    }>;
  }> {
    try {
      const response = await superAxios.get(this.buildEndpoint('routes'));
      return response.data;
    } catch (error: any) {
      console.error('Error fetching routes:', error);
      throw error;
    }
  }

  /**
   * Create a new route
   */
  async createRoute(routeData: {
    route_path: string;
    route_name: string;
    route_description?: string;
    is_public?: boolean;
  }): Promise<{
    id: number;
    route_path: string;
    route_name: string;
    route_description: string;
    is_public: boolean;
    is_active: boolean;
  }> {
    try {
      const response = await superAxios.post(this.buildEndpoint('routes'), routeData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating route:', error);
      throw error;
    }
  }

  /**
   * Update user's role
   */
  async updateUserRole(userId: number, roleId: number): Promise<{
    id: number;
    role_id: number;
    role_name: string;
    updated_at: string;
  }> {
    try {
      const response = await superAxios.put(this.buildEndpoint(`users/${userId}`), {
        role_id: roleId
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Check if user has access to a specific route
   */
  async checkRouteAccess(route: string): Promise<{
    has_access: boolean;
    reason?: string;
  }> {
    try {
      const response = await superAxios.post(this.buildEndpoint('check-access'), {
        resource_type: 'route',
        resource_identifier: route
      });
      return response.data;
    } catch (error: any) {
      console.error('Error checking route access:', error);
      throw error;
    }
  }

  /**
   * Check if user has a specific privilege
   */
  async checkPrivilege(privilegeName: string): Promise<{
    has_access: boolean;
    reason?: string;
  }> {
    try {
      const response = await superAxios.post(this.buildEndpoint('check-access'), {
        resource_type: 'privilege',
        resource_identifier: privilegeName
      });
      return response.data;
    } catch (error: any) {
      console.error('Error checking privilege:', error);
      throw error;
    }
  }

  /**
   * Get privilege statistics
   */
  async getPrivilegeStats(): Promise<{
    total_privileges: number;
    route_privileges: number;
    action_privileges: number;
    feature_privileges: number;
    active_privileges: number;
    inactive_privileges: number;
  }> {
    try {
      const response = await superAxios.get(this.buildEndpoint('privileges/stats'));
      return response.data;
    } catch (error: any) {
      console.error('Error fetching privilege stats:', error);
      throw error;
    }
  }

  /**
   * Get role statistics
   */
  async getRoleStats(): Promise<{
    total_roles: number;
    active_roles: number;
    inactive_roles: number;
    users_per_role: Array<{
      role_id: number;
      role_name: string;
      user_count: number;
    }>;
  }> {
    try {
      const response = await superAxios.get(this.buildEndpoint('roles/stats'));
      return response.data;
    } catch (error: any) {
      console.error('Error fetching role stats:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const simplifiedRBACService = new SimplifiedRBACService();
export default simplifiedRBACService;

