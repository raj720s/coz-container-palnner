import { BaseService } from '@/services/baseService';
import { store } from '@/store';
import { apiSlice } from '@/store/api/apiSlice';
import { addNotification } from '@/store/slices/uiSlice';
import { setLoading } from '@/store/slices/authSlice';

/**
 * Hybrid Service - Bridges complex business logic with RTK Query cache management
 * Use this for operations that need both complex logic AND state management
 */
export class HybridService extends BaseService {
  protected readonly basePath = '';

  /**
   * Complex user creation with business logic
   * Use this when you need validation, multiple API calls, or complex transformations
   */
  async createUserWithValidation(userData: any) {
    try {
      store.dispatch(setLoading(true));
      
      // Complex business logic here
      this.validateUserData(userData);
      
      // Multiple API calls if needed
      const organizationExists = await this.checkOrganizationExists(userData.organisation_name);
      if (!organizationExists) {
        await this.createOrganization(userData.organisation_name);
      }
      
      // Use the RTK Query mutation for actual creation and cache management
      const result = await store.dispatch(
        apiSlice.endpoints.createUser.initiate(userData)
      ).unwrap();
      
      // Additional business logic after creation
      await this.sendWelcomeEmail(result.email);
      
      store.dispatch(addNotification({
        type: 'success',
        title: 'User Created',
        message: `User ${result.first_name} created successfully with welcome email sent`
      }));
      
      return result;
    } catch (error) {
      this.handleError(error, 'Failed to create user');
      throw error;
    } finally {
      store.dispatch(setLoading(false));
    }
  }

  /**
   * Complex bulk operations with progress tracking
   */
  async bulkUserOperations(operations: Array<{ type: 'create' | 'update' | 'delete'; data: any }>) {
    const results = [];
    let completed = 0;
    
    try {
      store.dispatch(setLoading(true));
      
      for (const operation of operations) {
        try {
          let result;
          
          switch (operation.type) {
            case 'create':
              result = await store.dispatch(
                apiSlice.endpoints.createUser.initiate(operation.data)
              ).unwrap();
              break;
              
            case 'update':
              result = await store.dispatch(
                apiSlice.endpoints.updateUser.initiate({
                  id: operation.data.id,
                  data: operation.data
                })
              ).unwrap();
              break;
              
            case 'delete':
              result = await store.dispatch(
                apiSlice.endpoints.deleteUser.initiate(operation.data.id)
              ).unwrap();
              break;
          }
          
          results.push({ success: true, data: result });
          completed++;
          
          // Update progress
          store.dispatch(addNotification({
            type: 'info',
            title: 'Progress',
            message: `Completed ${completed}/${operations.length} operations`
          }));
          
        } catch (error) {
          results.push({ success: false, error: error });
        }
      }
      
      return results;
    } finally {
      store.dispatch(setLoading(false));
    }
  }

  /**
   * File processing with state updates
   */
  async processExcelFile(file: File) {
    try {
      store.dispatch(setLoading(true));
      store.dispatch(addNotification({
        type: 'info',
        title: 'Processing',
        message: 'Processing Excel file...'
      }));
      
      // Use your existing Excel processing logic
      const processedData = await this.parseExcelFile(file);
      
      // Validate and transform data
      const validatedData = this.validateExcelData(processedData);
      
      // Batch create users using RTK Query
      const createdUsers = [];
      for (const userData of validatedData) {
        try {
          const result = await store.dispatch(
            apiSlice.endpoints.createUser.initiate(userData)
          ).unwrap();
          createdUsers.push(result);
        } catch (error) {
          console.error('Failed to create user:', error);
        }
      }
      
      store.dispatch(addNotification({
        type: 'success',
        title: 'Import Complete',
        message: `Successfully imported ${createdUsers.length}/${validatedData.length} users`
      }));
      
      return {
        total: validatedData.length,
        successful: createdUsers.length,
        failed: validatedData.length - createdUsers.length,
        users: createdUsers
      };
      
    } catch (error) {
      store.dispatch(addNotification({
        type: 'error',
        title: 'Import Failed',
        message: 'Failed to process Excel file'
      }));
      throw error;
    } finally {
      store.dispatch(setLoading(false));
    }
  }

  // Private helper methods
  private validateUserData(userData: any) {
    const requiredFields = ['first_name', 'last_name', 'email', 'organisation_name'];
    this.validateRequiredFields(userData, requiredFields);
    
    // Additional business validations
    if (!this.isValidEmail(userData.email)) {
      throw new Error('Invalid email format');
    }
    
    if (userData.first_name.length < 2) {
      throw new Error('First name must be at least 2 characters');
    }
  }

  private async checkOrganizationExists(orgName: string): Promise<boolean> {
    try {
      const result = await this.get(`/organization/check`, { name: orgName });
      return result.exists;
    } catch {
      return false;
    }
  }

  private async createOrganization(orgName: string) {
    return this.post('/organization', { name: orgName });
  }

  private async sendWelcomeEmail(email: string) {
    return this.post('/email/welcome', { email });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async parseExcelFile(file: File): Promise<any[]> {
    // Your existing Excel parsing logic
    return [];
  }

  private validateExcelData(data: any[]): any[] {
    // Your existing validation logic
    return data.filter(item => this.isValidRowData(item));
  }

  private isValidRowData(row: any): boolean {
    return row.first_name && row.last_name && row.email;
  }
}

// Export singleton instance
export const hybridService = new HybridService();
