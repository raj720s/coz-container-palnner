import { BaseService } from './baseService';
import {
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerResponse,
  CustomerListRequest,
  CustomerListResponse,
  ApiResponse
} from '@/types/api';

export class CustomerService extends BaseService {
  protected readonly basePath = '/master-data/v1';

  /**
   * Create a new customer
   * @param customerData - Customer creation data
   * @returns Promise<CustomerResponse>
   */
  async createCustomer(customerData: CreateCustomerRequest): Promise<CustomerResponse> {
    this.validateRequiredFields(customerData, [
      'name', 
      'customer_code', 
      'contact_person', 
      'email', 
      'phone', 
      'address', 
      'country', 
      'tax_id'
    ]);
    return this.post<CustomerResponse>(this.buildEndpoint('customer'), customerData);
  }

  /**
   * Get customer by ID
   * @param id - Customer ID
   * @returns Promise<CustomerResponse>
   */
  async getCustomer(id: string | number): Promise<CustomerResponse> {
    return this.get<CustomerResponse>(this.buildEndpoint('customer', id));
  }

  /**
   * Update customer by ID
   * @param id - Customer ID
   * @param customerData - Partial customer data to update
   * @returns Promise<CustomerResponse>
   */
  async updateCustomer(id: string | number, customerData: UpdateCustomerRequest): Promise<CustomerResponse> {
    return this.put<CustomerResponse>(this.buildEndpoint('customer', id), customerData);
  }

  /**
   * Patch customer by ID
   * @param id - Customer ID
   * @param customerData - Partial customer data to update
   * @returns Promise<CustomerResponse>
   */
  async patchCustomer(id: string | number, customerData: UpdateCustomerRequest): Promise<CustomerResponse> {
    return this.patch<CustomerResponse>(this.buildEndpoint('customer', id), customerData);
  }

  /**
   * Delete customer by ID
   * @param id - Customer ID
   * @returns Promise<{ success: boolean }>
   */
  async deleteCustomer(id: string | number): Promise<{ success: boolean }> {
    console.log('🚀 CustomerService.deleteCustomer called with:', { id });
    console.log('🌐 Making DELETE request to endpoint: /master-data/v1/customer/{id}');
    
    try {
      const result = await this.delete<{ success: boolean }>(`/master-data/v1/customer/${id}`);
      console.log('✅ CustomerService.deleteCustomer success:', result);
      return result;
    } catch (error) {
      console.error('❌ CustomerService.deleteCustomer error:', error);
      throw error;
    }
  }

  /**
   * Get list of customers with filtering and pagination
   * @param params - Query parameters for filtering and pagination
   * @returns Promise<CustomerListResponse>
   */
  async getCustomers(params: CustomerListRequest = {}): Promise<CustomerListResponse> {
    const cleanParams = this.buildParams(params);
    return this.post<CustomerListResponse>(this.buildEndpoint('customer', 'list'), cleanParams);
  }

  /**
   * Search customers by name or code
   * @param query - Search query
   * @param limit - Maximum number of results
   * @returns Promise<CustomerResponse[]>
   */
  async searchCustomers(query: string, limit: number = 10): Promise<CustomerResponse[]> {
    const response = await this.post<CustomerListResponse>(this.buildEndpoint('customer', 'list'), { 
      name: query, 
      page_size: limit 
    });
    return response.results;
  }

  /**
   * Get customers by country
   * @param country - Country name to search for
   * @param params - Additional query parameters
   * @returns Promise<CustomerListResponse>
   */
  async getCustomersByCountry(country: string, params: Omit<CustomerListRequest, 'country'> = {}): Promise<CustomerListResponse> {
    const cleanParams = this.buildParams({ ...params, country });
    return this.post<CustomerListResponse>(this.buildEndpoint('customer', 'list'), cleanParams);
  }

  /**
   * Get customers by city
   * @param city - City name to search for
   * @param params - Additional query parameters
   * @returns Promise<CustomerListResponse>
   */
  async getCustomersByCity(city: string, params: Omit<CustomerListRequest, 'city'> = {}): Promise<CustomerListResponse> {
    const cleanParams = this.buildParams({ ...params, city });
    return this.post<CustomerListResponse>(this.buildEndpoint('customer', 'list'), cleanParams);
  }

  /**
   * Bulk update customer status
   * @param customerIds - Array of customer IDs
   * @param isActive - New status
   * @returns Promise<{ success: boolean }>
   */
  async bulkUpdateCustomerStatus(customerIds: (string | number)[], isActive: boolean): Promise<{ success: boolean }> {
    return this.put<{ success: boolean }>(this.buildEndpoint('customer', 'bulk-status'), {
      customer_ids: customerIds,
      is_active: isActive
    });
  }

  /**
   * Export customers data
   * @param params - Export parameters
   * @returns Promise<CustomerResponse[]>
   */
  async exportCustomers(params: CustomerListRequest = {}): Promise<CustomerResponse[]> {
    const exportParams = { ...params, export: true, page_size: 1000 };
    const response = await this.post<CustomerListResponse>(this.buildEndpoint('customer', 'list'), exportParams);
    return response.results;
  }

  /**
   * Get customer statistics
   * @returns Promise<ApiResponse>
   */
  async getCustomerStatistics(): Promise<ApiResponse> {
    return this.get<ApiResponse>(this.buildEndpoint('customer', 'statistics'));
  }

  /**
   * Validate customer code uniqueness
   * @param customerCode - Customer code to validate
   * @param excludeId - Customer ID to exclude from validation (for updates)
   * @returns Promise<{ isUnique: boolean }>
   */
  async validateCustomerCode(customerCode: string, excludeId?: string | number): Promise<{ isUnique: boolean }> {
    const params: CustomerListRequest = { code: customerCode, page_size: 1 };
    const response = await this.getCustomers(params);
    
    if (excludeId) {
      // Filter out the current record being updated
      const filteredResults = response.results.filter(customer => customer.id !== Number(excludeId));
      return { isUnique: filteredResults.length === 0 };
    }
    
    return { isUnique: response.results.length === 0 };
  }

  /**
   * Validate customer email uniqueness
   * @param email - Customer email to validate
   * @param excludeId - Customer ID to exclude from validation (for updates)
   * @returns Promise<{ isUnique: boolean }>
   */
  async validateCustomerEmail(email: string, excludeId?: string | number): Promise<{ isUnique: boolean }> {
    const params: CustomerListRequest = { email, page_size: 1 };
    const response = await this.getCustomers(params);
    
    if (excludeId) {
      // Filter out the current record being updated
      const filteredResults = response.results.filter(customer => customer.id !== Number(excludeId));
      return { isUnique: filteredResults.length === 0 };
    }
    
    return { isUnique: response.results.length === 0 };
  }
}

// Export singleton instance
export const customerService = new CustomerService();
export default customerService;
