"use client";

import React, { useState, useEffect } from 'react';
import { userService, roleService } from '@/services';
import { 
  CreateUserRequest, 
  UserDetailResponse, 
  RoleResponse,
  CreateRoleRequest 
} from '@/types/api';

export function UserManagementExample() {
  const [users, setUsers] = useState<UserDetailResponse[]>([]);
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load users and roles on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load users and roles in parallel
      const [usersResponse, rolesResponse] = await Promise.all([
        userService.getUsers({ limit: 50 }),
        roleService.getRoles({ limit: 50 })
      ]);
      
      setUsers(usersResponse.data);
      setRoles(rolesResponse.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: CreateUserRequest) => {
    try {
      const newUser = await userService.createUser(userData);
      setUsers(prev => [...prev, { ...newUser, id: Date.now() }]); // Mock ID for demo
      alert('User created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleCreateRole = async (roleData: CreateRoleRequest) => {
    try {
      const newRole = await roleService.createRole(roleData);
      setRoles(prev => [...prev, { ...newRole, id: Date.now() }]); // Mock ID for demo
      alert('Role created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await userService.deleteUser(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
      alert('User deleted successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    try {
      await roleService.deleteRole(roleId);
      setRoles(prev => prev.filter(role => role.id !== roleId));
      alert('Role deleted successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error: {error}
        <button 
          onClick={loadData}
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">User & Role Management Example</h1>
      
      {/* Users Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Users ({users.length})</h2>
        <div className="space-y-2">
          {users.map(user => (
            <div key={user.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <span className="font-medium">{user.first_name} {user.last_name}</span>
                <span className="text-gray-500 ml-2">({user.email})</span>
                <span className="text-gray-400 ml-2">- {user.organisation_name}</span>
              </div>
              <button
                onClick={() => handleDeleteUser(user.id)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Roles Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Roles ({roles.length})</h2>
        <div className="space-y-2">
          {roles.map(role => (
            <div key={role.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <span className="font-medium">{role.name}</span>
                {role.description && (
                  <span className="text-gray-500 ml-2">- {role.description}</span>
                )}
                <span className="text-gray-400 ml-2">
                  ({role.privileges.length} privileges)
                </span>
              </div>
              <button
                onClick={() => handleDeleteRole(role.id)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="space-x-4">
          <button
            onClick={() => handleCreateUser({
              status: true,
              first_name: 'John',
              last_name: 'Doe',
              email: 'john.doe@example.com',
              organisation_name: 'Example Corp',
              role: 1
            })}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Create Sample User
          </button>
          
          <button
            onClick={() => handleCreateRole({
              name: 'Sample Role',
              description: 'A sample role for demonstration',
              privileges: [1, 2, 3],
              is_active: true
            })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Sample Role
          </button>
          
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}
