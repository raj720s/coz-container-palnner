import React from 'react';
import { useSimpleRBAC } from '@/hooks/useSimpleRBAC';
import { 
  ConditionalRender, 
  RoleBasedRender, 
  ProtectedButton, 
  AdminOnly,
  SuperUserOnly 
} from './SimpleRBACComponents';

/**
 * Simplified Test Component to demonstrate RBAC functionality
 * This component shows different content based on user privileges
 */
export const SimpleRBACTest: React.FC = () => {
  const { 
    user, 
    userPrivileges, 
    userRole, 
    isSuperUser, 
    hasPrivilege, 
    canPerformAction,
    getUserRole,
    getRoleName
  } = useSimpleRBAC();

  if (!user) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          ⚠️ Not Authenticated
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300">
          Please log in to see RBAC functionality in action.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info Section */}
      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-4">
          👤 User Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
          <div>
            <div><strong>Name:</strong> {user.name}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Role ID:</strong> {getUserRole()}</div>
            <div><strong>Role Name:</strong> {getRoleName()}</div>
          </div>
          <div>
            <div><strong>Superuser:</strong> {isSuperUser() ? '✅ Yes' : '❌ No'}</div>
            <div><strong>Total Privileges:</strong> {userPrivileges.length}</div>
            <div><strong>Privilege Version:</strong> {user.privilege_version}</div>
          </div>
        </div>
      </div>

      {/* Privilege Testing Section */}
      <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <h3 className="text-lg font-medium text-green-800 dark:text-green-200 mb-4">
          🔐 Privilege Testing
        </h3>
        
        <div className="space-y-4">
          {/* Role Management Privileges */}
          <div className="space-y-2">
            <h4 className="font-medium text-green-700 dark:text-green-300">Role Management:</h4>
            <div className="flex flex-wrap gap-2">
              <ConditionalRender privilege="CREATE_ROLE">
                <span className="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
                  ✅ CREATE_ROLE
                </span>
              </ConditionalRender>
              <ConditionalRender privilege="UPDATE_ROLE">
                <span className="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
                  ✅ UPDATE_ROLE
                </span>
              </ConditionalRender>
              <ConditionalRender privilege="DELETE_ROLE">
                <span className="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
                  ✅ DELETE_ROLE
                </span>
              </ConditionalRender>
              <ConditionalRender privilege="VIEW_ROLE_LIST">
                <span className="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
                  ✅ VIEW_ROLE_LIST
                </span>
              </ConditionalRender>
            </div>
          </div>

          {/* User Management Privileges */}
          <div className="space-y-2">
            <h4 className="font-medium text-green-700 dark:text-green-300">User Management:</h4>
            <div className="flex flex-wrap gap-2">
              <ConditionalRender privilege="CREATE_USER">
                <span className="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
                  ✅ CREATE_USER
                </span>
              </ConditionalRender>
              <ConditionalRender privilege="UPDATE_USER">
                <span className="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
                  ✅ UPDATE_USER
                </span>
              </ConditionalRender>
              <ConditionalRender privilege="DELETE_USER">
                <span className="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
                  ✅ DELETE_USER
                </span>
              </ConditionalRender>
              <ConditionalRender privilege="VIEW_USER_LIST">
                <span className="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
                  ✅ VIEW_USER_LIST
                </span>
              </ConditionalRender>
            </div>
          </div>

          {/* Container Management Privileges */}
          <div className="space-y-2">
            <h4 className="font-medium text-green-700 dark:text-green-300">Container Management:</h4>
            <div className="flex flex-wrap gap-2">
              <ConditionalRender privilege="VIEW_CONTAINER_PRIORITY">
                <span className="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
                  ✅ VIEW_CONTAINER_PRIORITY
                </span>
              </ConditionalRender>
              <ConditionalRender privilege="CREATE_PRIORITY">
                <span className="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
                  ✅ CREATE_PRIORITY
                </span>
              </ConditionalRender>
              <ConditionalRender privilege="UPDATE_PRIORITY">
                <span className="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
                  ✅ UPDATE_PRIORITY
                </span>
              </ConditionalRender>
              <ConditionalRender privilege="DELETE_PRIORITY">
                <span className="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
                  ✅ DELETE_PRIORITY
                </span>
              </ConditionalRender>
            </div>
          </div>
        </div>
      </div>

      {/* Action Testing Section */}
      <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <h3 className="text-lg font-medium text-purple-800 dark:text-purple-200 mb-4">
          🎯 Action Testing
        </h3>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <ProtectedButton 
              action="create_role"
              variant="primary"
              size="sm"
              onClick={() => alert('Create Role action triggered!')}
            >
              Create Role
            </ProtectedButton>
            
            <ProtectedButton 
              action="update_user"
              variant="secondary"
              size="sm"
              onClick={() => alert('Update User action triggered!')}
            >
              Update User
            </ProtectedButton>
            
            <ProtectedButton 
              action="delete_priority"
              variant="danger"
              size="sm"
              onClick={() => alert('Delete Priority action triggered!')}
            >
              Delete Priority
            </ProtectedButton>
            
            <ProtectedButton 
              action="export_data"
              variant="success"
              size="sm"
              onClick={() => alert('Export Data action triggered!')}
            >
              Export Data
            </ProtectedButton>
          </div>
        </div>
      </div>

      {/* Role-Based Content Section */}
      <div className="p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
        <h3 className="text-lg font-medium text-orange-800 dark:text-orange-200 mb-4">
          👥 Role-Based Content
        </h3>
        
        <div className="space-y-4">
          <RoleBasedRender role={1}>
            <div className="p-3 bg-orange-200 dark:bg-orange-800 rounded text-orange-800 dark:text-orange-200">
              🎯 <strong>Admin Content:</strong> This content is only visible to admin users (role ID: 1)
            </div>
          </RoleBasedRender>
          
          <RoleBasedRender role={0}>
            <div className="p-3 bg-orange-200 dark:bg-orange-800 rounded text-orange-800 dark:text-orange-200">
              👤 <strong>User Content:</strong> This content is only visible to regular users (role ID: 0)
            </div>
          </RoleBasedRender>
          
          <AdminOnly>
            <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded text-blue-800 dark:text-blue-200">
              🔧 <strong>Admin Only:</strong> This content is only visible to administrators
            </div>
          </AdminOnly>
          
          <SuperUserOnly>
            <div className="p-3 bg-red-200 dark:bg-red-800 rounded text-red-800 dark:text-red-200">
              👑 <strong>Superuser Only:</strong> This content is only visible to superusers
            </div>
          </SuperUserOnly>
        </div>
      </div>

      {/* Privilege List Section */}
      <div className="p-6 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
          📋 All User Privileges ({userPrivileges.length})
        </h3>
        
        <div className="max-h-60 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {userPrivileges.map((privilege: string, index: number) => (
              <div 
                key={index}
                className="px-2 py-1 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded text-xs"
              >
                {privilege}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleRBACTest;
