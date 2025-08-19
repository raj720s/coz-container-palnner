"use client";

import React from 'react';
import { useRBAC } from '@/hooks/useRBAC';

export const RBACTest: React.FC = () => {
  try {
    const rbac = useRBAC();
    
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">RBAC Test Component</h3>
        <div className="space-y-2 text-sm">
          <p><strong>User:</strong> {rbac.user?.name || 'No user'}</p>
          <p><strong>Role:</strong> {rbac.userRole}</p>
          <p><strong>Privileges:</strong> {rbac.userPrivileges.length}</p>
          <p><strong>Is Admin:</strong> {rbac.isAdmin() ? 'Yes' : 'No'}</p>
          <p><strong>Can Access User Management:</strong> {rbac.canAccessRoute('/admin/user-management') ? 'Yes' : 'No'}</p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('RBACTest error:', error);
    return (
      <div className="p-4 border rounded-lg bg-red-50 text-red-700">
        <h3 className="text-lg font-semibold mb-2">RBAC Test Error</h3>
        <p>Error: {error instanceof Error ? error.message : String(error)}</p>
      </div>
    );
  }
};

export default RBACTest;
