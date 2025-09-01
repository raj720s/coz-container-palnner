import superAxios from '@/utils/superAxios';

export interface PrivilegeResponse {
  id: number;
  privilege_name: string;
  privilege_desc: string;
  module_id: string;
}

export interface PrivilegeListRequest {
  role_id: number;
}

export interface PrivilegeListResponse {
  count: number;
  results: PrivilegeResponse[];
}

class PrivilegeService {
  /**
   * Fetch privileges for a specific role
   * @param request - Request containing role_id
   * @returns Promise with privilege list
   */
  async getPrivileges(request: PrivilegeListRequest): Promise<PrivilegeListResponse> {
    try {
      const response = await superAxios.post('/admin/v1/privilege/list', request);
      return response.data;
    } catch (error) {
      console.error('Error fetching privileges:', error);
      throw error;
    }
  }

  /**
   * Extract privilege names from privilege list response
   * @param privileges - Array of privilege objects
   * @returns Array of privilege names (strings)
   */
  extractPrivilegeNames(privileges: PrivilegeResponse[]): string[] {
    return privileges.map(privilege => privilege.privilege_name);
  }
}

export const privilegeService = new PrivilegeService();
export default privilegeService;
