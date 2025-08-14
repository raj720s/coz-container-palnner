"use client";

import React, { useState, useEffect } from 'react';
import { 
  useGetUsersQuery, 
  useCreateUserMutation, 
  useUpdateUserMutation, 
  useDeleteUserMutation,
  useBulkUpdateUserStatusMutation 
} from '@/store/api/apiSlice';
import { useAppDispatch, useAppSelector, useUsers, useSelectedUsers } from '@/store/hooks';
import { 
  selectUser, 
  deselectUser, 
  clearSelection, 
  setSearchQuery,
  setCurrentPage,
  setPageSize 
} from '@/store/slices/userSlice';
import { addNotification } from '@/store/slices/uiSlice';
import { CreateUserRequest } from '@/types/api';

export function ReduxUserManagementExample() {
  const dispatch = useAppDispatch();
  
  // Use Redux state
  const { searchQuery, currentPage, pageSize, selectedUsers } = useUsers();
  const selectedUserIds = useSelectedUsers();
  
  // Local state for form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // RTK Query hooks
  const { 
    data: usersResponse, 
    isLoading, 
    error, 
    refetch 
  } = useGetUsersQuery({
    page: currentPage,
    limit: pageSize,
    search: searchQuery
  });
  
  // Mutation hooks
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();
  const [bulkUpdateStatus, { isLoading: bulkUpdating }] = useBulkUpdateUserStatusMutation();
  
  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(e.target.value));
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page));
  };
  
  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    dispatch(setPageSize(size));
  };
  
  // Handle user selection
  const handleUserSelect = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      dispatch(deselectUser(userId));
    } else {
      dispatch(selectUser(userId));
    }
  };
  
  // Handle create user
  const handleCreateUser = async (userData: CreateUserRequest) => {
    try {
      await createUser(userData).unwrap();
      setShowCreateForm(false);
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
  
  // Handle update user
  const handleUpdateUser = async (userId: number, userData: Partial<CreateUserRequest>) => {
    try {
      await updateUser({ id: userId, data: userData }).unwrap();
      setEditingUser(null);
      dispatch(addNotification({
        type: 'success',
        title: 'Success',
        message: 'User updated successfully!'
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to update user'
      }));
    }
  };
  
  // Handle delete user
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
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
        message: error.message || 'Failed to delete user'
      }));
    }
  };
  
  // Handle bulk operations
  const handleBulkStatusUpdate = async (status: boolean) => {
    if (selectedUserIds.length === 0) {
      dispatch(addNotification({
        type: 'warning',
        title: 'Warning',
        message: 'Please select users first'
      }));
      return;
    }
    
    try {
      await bulkUpdateStatus({ userIds: selectedUserIds, status }).unwrap();
      dispatch(clearSelection());
      dispatch(addNotification({
        type: 'success',
        title: 'Success',
        message: `${selectedUserIds.length} users updated successfully!`
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to update users'
      }));
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
  
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-medium">Error loading users</h3>
        <p className="text-red-600 mt-1">{(error as any).message}</p>
        <button 
          onClick={refetch}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }
  
  const users = usersResponse?.data || [];
  const totalUsers = usersResponse?.total || 0;
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Redux User Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create User
        </button>
      </div>
      
      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>
      
      {/* Bulk Actions */}
      {selectedUserIds.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-blue-800">
            {selectedUserIds.length} user(s) selected
          </span>
          <button
            onClick={() => handleBulkStatusUpdate(true)}
            disabled={bulkUpdating}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Activate
          </button>
          <button
            onClick={() => handleBulkStatusUpdate(false)}
            disabled={bulkUpdating}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            Deactivate
          </button>
          <button
            onClick={() => dispatch(clearSelection())}
            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Selection
          </button>
        </div>
      )}
      
      {/* Users List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedUserIds.length === users.length && users.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      users.forEach(user => dispatch(selectUser(user.id)));
                    } else {
                      dispatch(clearSelection());
                    }
                  }}
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-900">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-900">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-900">Organization</th>
              <th className="px-4 py-3 text-left font-medium text-gray-900">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => handleUserSelect(user.id)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3 text-gray-600">{user.organisation_name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={deleting}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No users found
          </div>
        )}
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-gray-600">
          Showing {users.length} of {totalUsers} users
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 border border-gray-300 rounded bg-blue-50">
            Page {currentPage}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={users.length < pageSize}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      
      {/* Status indicators */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        {(creating || updating || deleting || bulkUpdating) && (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>
              {creating && 'Creating user...'}
              {updating && 'Updating user...'}
              {deleting && 'Deleting user...'}
              {bulkUpdating && 'Updating users...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
