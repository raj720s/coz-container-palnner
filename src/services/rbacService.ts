import superAxios from '@/utils/superAxios';
import { BaseService } from './baseService';

/**
 * RBAC Service for handling privilege and permission operations
 */
export class RBACService extends BaseService {
  protected readonly basePath = '/admin/v1';

  /**
   * Fetch user's role and privileges
   */
  async getUserPrivileges(userId: number): Promise<{
    role_id: number;
    role_name: string;
    privileges: string[];
    privilege_version: string;
  }> {
    try {
      // First get user's role information
      const userResponse = await superAxios.get(`/user/v1/json-info`);
      const roleId = userResponse.data.role_id;
      
      if (!roleId) {
        throw new Error('User has no assigned role');
      }

      // Then get the role's privileges
      const rolesResponse = await superAxios.get(
        this.buildEndpoint('role/list'),
        {
          params: { include_privilege_data: true }
        }
      );

      const userRole = rolesResponse.data.results.find((role: any) => role.id === roleId);
      
      if (!userRole) {
        throw new Error('User role not found');
      }

      return {
        role_id: userRole.id,
        role_name: userRole.role_name,
        privileges: userRole.privilege_names || [],
        privilege_version: `${userRole.id}_${userRole.modified_on || userRole.created_on}_${userRole.privilege_names?.length || 0}`
      };
    } catch (error: any) {
      console.error('Error fetching user privileges:', error);
      throw error;
    }
  }

  /**
   * Check if user has specific privilege
   */
  hasPrivilege(userPrivileges: string[], privilege: string): boolean {
    return userPrivileges.includes(privilege);
  }

  /**
   * Check if user has any of the specified privileges
   */
  hasAnyPrivilege(userPrivileges: string[], privileges: string[]): boolean {
    return privileges.some(privilege => userPrivileges.includes(privilege));
  }

  /**
   * Check if user has all specified privileges
   */
  hasAllPrivileges(userPrivileges: string[], privileges: string[]): boolean {
    return privileges.every(privilege => userPrivileges.includes(privilege));
  }

  /**
   * Get route access based on privileges
   */
  canAccessRoute(userPrivileges: string[], route: string): boolean {
    const routePrivilegeMap = this.getRoutePrivilegeMapping();
    const requiredPrivileges = routePrivilegeMap[route];

    if (!requiredPrivileges || requiredPrivileges.length === 0) {
      return true; // No specific privileges required
    }

    return this.hasAnyPrivilege(userPrivileges, requiredPrivileges);
  }

  /**
   * Get action access based on privileges
   */
  canPerformAction(userPrivileges: string[], action: string, module?: string): boolean {
    const actionPrivilege = module ? `${action}_${module}` : action;
    return this.hasPrivilege(userPrivileges, actionPrivilege);
  }

  /**
   * Route to privilege mapping
   * This defines which privileges are required for each route
   */
  private getRoutePrivilegeMapping(): Record<string, string[]> {
    return {
      // Admin Routes
      'admin/dashboard': ['VIEW_DASHBOARD'],
      'admin/user-management': ['VIEW_USER_LIST'],
      'admin/role-management': ['VIEW_ROLE_LIST'],
      'admin/container-types': ['VIEW_CONTAINER_TYPES'],
      'admin/container-thresholds': ['VIEW_CONTAINER_THRESHOLDS'],
      'admin/container-priority': ['VIEW_CONTAINER_PRIORITY'],
      'admin/port-customer-master': ['VIEW_PORT_CUSTOMER_MASTER'],
      'admin/port-customer-master/pol-ports': ['VIEW_POL_PORTS'],
      'admin/port-customer-master/pod-ports': ['VIEW_POD_PORTS'],
      'admin/port-customer-master/customers': ['VIEW_CUSTOMERS'],
      'admin/shipment-upload': ['VIEW_SHIPMENT_UPLOAD'],
      'admin/container-planning': ['VIEW_CONTAINER_PLANNING'],
      'admin/assignment-results': ['VIEW_ASSIGNMENT_RESULTS'],
      'admin/repositioning-summary': ['VIEW_REPOSITIONING_SUMMARY'],
      'admin/validation-summary': ['VIEW_VALIDATION_SUMMARY'],
      'admin/data-backup': ['VIEW_DATA_BACKUP'],
      'admin/system-settings': ['VIEW_SYSTEM_SETTINGS'],
      'admin/test-validation': ['VIEW_TEST_VALIDATION'],
      'admin/shipment-operations/uploads-history': ['VIEW_UPLOADS_HISTORY'],
      'admin/shipment-operations/shipment-history': ['VIEW_SHIPMENT_HISTORY'],

      // User Routes (usually same privileges with different scope)
      'user/dashboard': ['VIEW_USER_DASHBOARD'],
      'user/shipment-upload': ['VIEW_SHIPMENT_UPLOAD'],
      'user/container-planning': ['VIEW_CONTAINER_PLANNING'],
      'user/assignment-results': ['VIEW_ASSIGNMENT_RESULTS'],
      'user/validation-summary': ['VIEW_VALIDATION_SUMMARY'],
      'user/repositioning-summary': ['VIEW_REPOSITIONING_SUMMARY'],
      'user/container-types': ['VIEW_CONTAINER_TYPES'],
      'user/container-thresholds': ['VIEW_CONTAINER_THRESHOLDS'],
      'user/container-priority': ['VIEW_CONTAINER_PRIORITY'],
      'user/port-customer-master': ['VIEW_PORT_CUSTOMER_MASTER'],
      'user/port-customer-master/pol-ports': ['VIEW_POL_PORTS'],
      'user/port-customer-master/pod-ports': ['VIEW_POD_PORTS'],
      'user/port-customer-master/customers': ['VIEW_CUSTOMERS'],
      'user/shipment-operations/uploads-history': ['VIEW_UPLOADS_HISTORY'],
    };
  }

  /**
   * Action to privilege mapping
   */
  getActionPrivilegeMapping(): Record<string, string> {
    return {
      // User Management
      'create_user': 'CREATE_USER',
      'update_user': 'UPDATE_USER',
      'delete_user': 'DELETE_USER',
      'view_user': 'VIEW_USER',

      // Role Management
      'create_role': 'CREATE_ROLE',
      'update_role': 'UPDATE_ROLE',
      'delete_role': 'DELETE_ROLE',
      'view_role': 'VIEW_ROLE',

      // Container Types
      'create_container_type': 'CREATE_CONTAINER_TYPE',
      'update_container_type': 'UPDATE_CONTAINER_TYPE',
      'delete_container_type': 'DELETE_CONTAINER_TYPE',
      'view_container_type': 'VIEW_CONTAINER_TYPE',

      // Container Thresholds
      'create_threshold': 'CREATE_THRESHOLD',
      'update_threshold': 'UPDATE_THRESHOLD',
      'delete_threshold': 'DELETE_THRESHOLD',
      'view_threshold': 'VIEW_THRESHOLD',

      // Container Priority
      'create_priority': 'CREATE_PRIORITY',
      'update_priority': 'UPDATE_PRIORITY',
      'delete_priority': 'DELETE_PRIORITY',
      'view_priority': 'VIEW_PRIORITY',

      // Ports
      'create_port': 'CREATE_PORT',
      'update_port': 'UPDATE_PORT',
      'delete_port': 'DELETE_PORT',
      'view_port': 'VIEW_PORT',

      // General actions
      'export_data': 'EXPORT_DATA',
      'import_data': 'IMPORT_DATA',
      'backup_data': 'BACKUP_DATA',
      'restore_data': 'RESTORE_DATA',
    };
  }
}

// Create and export singleton instance
export const rbacService = new RBACService();
export default rbacService;
