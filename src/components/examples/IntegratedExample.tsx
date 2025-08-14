"use client";

import React, { useState } from 'react';
import { 
  useGetUsersQuery, 
  useCreateUserMutation,
  useDeleteUserMutation 
} from '@/store/api/apiSlice';
import { useAppDispatch } from '@/store/hooks';
import { addNotification } from '@/store/slices/uiSlice';
import { hybridService } from '@/store/services/hybridService';
import { userService } from '@/services';

/**
 * This example shows when to use RTK Query vs Services vs Hybrid approach
 */
export function IntegratedExample() {
  const dispatch = useAppDispatch();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // RTK Query hooks for standard CRUD operations
  const { data: users, isLoading, error, refetch } = useGetUsersQuery({ 
    page: 1, 
    limit: 10 
  });
  
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  // ========================================
  // RTK Query Examples (Use for 80% of cases)
  // ========================================

  // ✅ Perfect for simple CRUD operations
  const handleSimpleCreateUser = async () => {
    try {
      const userData = {
        first_name: 'John',
        last_name: 'Doe', 
        email: 'john.doe@example.com',
        organisation_name: 'Example Corp',
        role: 1,
        status: true
      };

      // RTK Query automatically:
      // - Shows loading state
      // - Updates cache
      // - Handles errors
      // - Triggers re-renders
      await createUser(userData).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        title: 'Success',
        message: 'User created successfully!'
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to create user'
      }));
    }
  };

  // ✅ Perfect for simple deletions with cache updates
  const handleSimpleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure?')) return;
    
    try {
      // RTK Query automatically updates cache and UI
      await deleteUser(userId).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        title: 'Success',
        message: 'User deleted successfully!'
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error', 
        message: 'Failed to delete user'
      }));
    }
  };

  // ========================================
  // Service Examples (Use for complex logic)
  // ========================================

  // ✅ Use services for complex business operations
  const handleComplexUserValidation = async () => {
    try {
      setIsProcessing(true);
      
      const userData = {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@newcorp.com',
        organisation_name: 'New Corp',
        role: 2,
        status: true
      };

      // Complex validation and business logic
      await userService.createUser(userData);
      
      // Manually refetch RTK Query data after service operation
      refetch();
      
      dispatch(addNotification({
        type: 'success',
        title: 'Success',
        message: 'User created with complex validation!'
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: error.message
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Use services for file operations
  const handleFileUpload = async () => {
    if (!selectedFile) {
      dispatch(addNotification({
        type: 'warning',
        title: 'Warning',
        message: 'Please select a file first'
      }));
      return;
    }

    try {
      setIsProcessing(true);
      
      // Use service for file processing (complex logic)
      const result = await userService.processExcelFile?.(selectedFile);
      
      // Manually refresh RTK Query cache after file processing
      refetch();
      
      dispatch(addNotification({
        type: 'success',
        title: 'Success',
        message: `File processed successfully! ${result?.count || 0} users imported.`
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to process file'
      }));
    } finally {
      setIsProcessing(false);
      setSelectedFile(null);
    }
  };

  // ========================================
  // Hybrid Examples (Best of both worlds)
  // ========================================

  // ✅ Use hybrid for complex operations that need state management
  const handleAdvancedUserCreation = async () => {
    try {
      const userData = {
        first_name: 'Advanced',
        last_name: 'User',
        email: 'advanced@example.com',
        organisation_name: 'Advanced Corp',
        role: 3,
        status: true
      };

      // Hybrid service handles:
      // - Complex validation
      // - Business logic  
      // - RTK Query cache updates
      // - Redux state management
      // - Progress notifications
      await hybridService.createUserWithValidation(userData);
      
      // No need to manually refetch - hybrid service handles it!
    } catch (error) {
      // Error already handled by hybrid service
      console.error('Advanced creation failed:', error);
    }
  };

  // ✅ Use hybrid for bulk operations with progress tracking
  const handleBulkOperations = async () => {
    try {
      const operations = [
        { type: 'create' as const, data: { first_name: 'Bulk1', last_name: 'User1', email: 'bulk1@example.com', organisation_name: 'Bulk Corp', role: 1, status: true } },
        { type: 'create' as const, data: { first_name: 'Bulk2', last_name: 'User2', email: 'bulk2@example.com', organisation_name: 'Bulk Corp', role: 1, status: true } },
        { type: 'create' as const, data: { first_name: 'Bulk3', last_name: 'User3', email: 'bulk3@example.com', organisation_name: 'Bulk Corp', role: 1, status: true } },
      ];

      // Hybrid service handles:
      // - Progress tracking
      // - Individual operation errors
      // - RTK Query cache updates
      // - Batch notifications
      await hybridService.bulkUserOperations(operations);
      
    } catch (error) {
      console.error('Bulk operations failed:', error);
    }
  };

  // ✅ Use hybrid for advanced file processing
  const handleAdvancedFileProcessing = async () => {
    if (!selectedFile) return;

    try {
      // Hybrid service handles:
      // - File parsing
      // - Data validation
      // - Batch user creation via RTK Query
      // - Progress notifications
      // - Error handling
      const result = await hybridService.processExcelFile(selectedFile);
      
      console.log('Processing result:', result);
      setSelectedFile(null);
    } catch (error) {
      console.error('Advanced file processing failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">RTK Query vs Services Integration Example</h1>
      
      {/* Current Users Display */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Current Users ({users?.total || 0})</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="text-red-600">Error loading users: {(error as any).message}</p>
            <button 
              onClick={refetch}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}
        
        <div className="grid gap-2">
          {users?.data?.slice(0, 5).map((user: any) => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span>{user.first_name} {user.last_name} ({user.email})</span>
              <button
                onClick={() => handleSimpleDeleteUser(user.id)}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Delete (RTK Query)
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* RTK Query Examples */}
      <div className="bg-blue-50 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">
          ✅ RTK Query Examples (80% of use cases)
        </h2>
        <p className="text-blue-600 mb-4">
          Perfect for: CRUD operations, data tables, real-time updates, form submissions
        </p>
        
        <div className="space-x-4">
          <button
            onClick={handleSimpleCreateUser}
            disabled={creating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create User (RTK Query)'}
          </button>
          
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Data (RTK Query)
          </button>
        </div>
      </div>

      {/* Services Examples */}
      <div className="bg-orange-50 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-orange-800">
          ✅ Services Examples (15% of use cases)
        </h2>
        <p className="text-orange-600 mb-4">
          Perfect for: Complex business logic, file operations, multi-step workflows
        </p>
        
        <div className="space-y-4">
          <div>
            <button
              onClick={handleComplexUserValidation}
              disabled={isProcessing}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Create with Complex Validation (Service)'}
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
            <button
              onClick={handleFileUpload}
              disabled={!selectedFile || isProcessing}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Upload File (Service)'}
            </button>
          </div>
        </div>
      </div>

      {/* Hybrid Examples */}
      <div className="bg-green-50 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-green-800">
          ✅ Hybrid Examples (5% of use cases - Best of both)
        </h2>
        <p className="text-green-600 mb-4">
          Perfect for: Complex operations that need both business logic AND state management
        </p>
        
        <div className="space-y-4">
          <div>
            <button
              onClick={handleAdvancedUserCreation}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Advanced User Creation (Hybrid)
            </button>
          </div>
          
          <div>
            <button
              onClick={handleBulkOperations}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Bulk Operations with Progress (Hybrid)
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            <button
              onClick={handleAdvancedFileProcessing}
              disabled={!selectedFile}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Advanced File Processing (Hybrid)
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">🎯 Summary</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-blue-100 p-4 rounded">
            <h3 className="font-semibold text-blue-800">RTK Query (80%)</h3>
            <p className="text-blue-600">Standard CRUD, data display, forms, real-time updates</p>
          </div>
          <div className="bg-orange-100 p-4 rounded">
            <h3 className="font-semibold text-orange-800">Services (15%)</h3>
            <p className="text-orange-600">Complex logic, file processing, business rules</p>
          </div>
          <div className="bg-green-100 p-4 rounded">
            <h3 className="font-semibold text-green-800">Hybrid (5%)</h3>
            <p className="text-green-600">Complex operations needing state management</p>
          </div>
        </div>
      </div>
    </div>
  );
}
