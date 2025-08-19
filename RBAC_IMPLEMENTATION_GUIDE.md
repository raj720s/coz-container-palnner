# Role-Based Access Control (RBAC) Implementation Guide

## Overview

This document provides a comprehensive guide for implementing and using the Role-Based Access Control (RBAC) system in our application. The RBAC system enables fine-grained control over user permissions based on modules, routes, and specific privileges.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Module System](#module-system)
3. [Permission Types](#permission-types)
4. [Implementation Components](#implementation-components)
5. [Usage Examples](#usage-examples)
6. [API Integration](#api-integration)
7. [Migration Guide](#migration-guide)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Architecture Overview

The RBAC system is built on several key concepts:

- **Modules**: Logical groupings of functionality (e.g., User Management, Role Management)
- **Privileges**: Specific permissions for actions (e.g., CREATE_USER, VIEW_ROLE_LIST)
- **Roles**: User classifications with different access levels (Admin=1, Manager=2, User=0)
- **Routes**: URL paths that require specific permissions to access

### Key Files

```
app/src/
├── config/
│   └── modules.json              # Module definitions and mappings
├── utils/
│   └── rbacUtils.ts              # Core RBAC utility functions
├── hooks/
│   └── useRBAC.ts               # React hooks for RBAC
├── components/
│   └── auth/
│       ├── withRBACAuth.tsx     # Enhanced HOC for route protection
│       └── Permission.tsx       # Component for conditional rendering
└── layout/
    └── AppSidebar.tsx           # Updated with RBAC menu filtering
```

## Module System

### Module Structure

Each module is defined in `app/src/config/modules.json` with the following structure:

```json
{
  "modules": {
    "10": {
      "name": "Role Management",
      "description": "Manage system roles and role configurations",
      "icon": "UserCircleIcon",
      "color": "blue",
      "routes": [
        "/admin/role-management",
        "/user/role-management"
      ],
      "privileges": [
        "CREATE_ROLE",
        "VIEW_ROLE",
        "VIEW_ROLE_LIST",
        "UPDATE_ROLE",
        "DELETE_ROLE"
      ]
    }
  }
}
```

### Current Modules

| Module ID | Name | Description | Primary Routes |
|-----------|------|-------------|----------------|
| 10 | Role Management | Manage system roles | `/admin/role-management` |
| 20 | Privilege Management | Manage system privileges | `/admin/privilege-management` |
| 30 | Permission Management | Manage role-permission assignments | `/admin/role-permission-management` |
| 60 | User Management | Manage users and profiles | `/admin/user-management` |
| 70 | Container Management | Container types, thresholds, planning | `/admin/container-*` |
| 80 | Port & Customer Management | Ports and customer relationships | `/admin/port-customer-master` |
| 90 | Shipment Operations | Shipment uploads and processing | `/admin/shipment-*` |
| 100 | Analytics & Reports | Results, validation, summaries | `/admin/assignment-results` |
| 110 | System Administration | System settings, backup | `/admin/system-settings` |
| 120 | Dashboard | Main overview pages | `/admin/dashboard`, `/user/dashboard` |

## Permission Types

### Role-Based Permissions

```typescript
enum UserRole {
  USER = 0,      // Basic user access
  ADMIN = 1,     // Full system access
  MANAGER = 2    // Management level access
}
```

### Privilege-Based Permissions

Privileges are specific actions users can perform:

```typescript
// User Management Privileges
"CREATE_USER"              // Create new users
"VIEW_USER"               // View user details
"VIEW_USER_LIST"          // View list of users
"UPDATE_USER"             // Update user information
"DELETE_USER"             // Delete users

// Role Management Privileges
"CREATE_ROLE"             // Create new roles
"VIEW_ROLE"               // View role details
"VIEW_ROLE_LIST"          // View list of roles
"UPDATE_ROLE"             // Update role information
"DELETE_ROLE"             // Delete roles
```

## Implementation Components

### 1. RBAC Utilities (`rbacUtils.ts`)

Core functions for permission checking:

```typescript
import { hasPrivilege, canAccessRoute, getModuleInfo } from '@/utils/rbacUtils';

// Check if user has specific privilege
const canCreateUser = hasPrivilege(userPrivileges, 'CREATE_USER');

// Check if user can access a route
const canAccessUserMgmt = canAccessRoute(userRole, userPrivileges, '/admin/user-management');

// Get module information
const moduleInfo = getModuleInfo('60'); // User Management module
```

### 2. RBAC Hooks (`useRBAC.ts`)

React hooks for easy permission checking:

```typescript
import { useRBAC, usePrivileges, useRouteAccess } from '@/hooks/useRBAC';

function MyComponent() {
  const { hasPrivilege, canAccessRoute, isAdmin } = useRBAC();
  const { hasRequired } = usePrivileges(['CREATE_USER', 'UPDATE_USER']);
  const { canAccess } = useRouteAccess('/admin/user-management');

  if (!canAccess) {
    return <div>Access Denied</div>;
  }

  return (
    <div>
      {hasPrivilege('CREATE_USER') && <CreateUserButton />}
      {isAdmin() && <AdminOnlyFeature />}
    </div>
  );
}
```

### 3. Permission Component (`Permission.tsx`)

Conditional rendering based on permissions:

```typescript
import Permission from '@/components/auth/Permission';

// Show content only if user has specific privilege
<Permission privilege="CREATE_USER">
  <CreateUserButton />
</Permission>

// Show content only if user can access route
<Permission route="/admin/user-management">
  <AdminUserPanel />
</Permission>

// Show content only for admin or manager
<Permission role={[1, 2]}>
  <AdminControls />
</Permission>

// Show content if user has any of these privileges
<Permission anyPrivileges={['CREATE_USER', 'UPDATE_USER']}>
  <UserManagementTools />
</Permission>
```

### 4. Enhanced HOCs (`withRBACAuth.tsx`)

Route-level access control:

```typescript
import { withRBACAuth, withAdminRBAC, withPrivilegeRBAC } from '@/components/auth/withRBACAuth';

// Admin-only access
export default withAdminRBAC(AdminDashboard);

// Specific privilege required
export default withPrivilegeRBAC(UserManagement, 'VIEW_USER_LIST');

// Multiple privilege options (user needs any one)
export default withAnyPrivilegeRBAC(UserManagement, ['CREATE_USER', 'UPDATE_USER']);

// Custom RBAC configuration
export default withRBACAuth(MyComponent, {
  role: [1, 2], // Admin or Manager
  module: '60', // User Management module
  anyPrivileges: ['CREATE_USER', 'VIEW_USER_LIST']
});
```

## Usage Examples

### 1. Page-Level Protection

```typescript
// app/src/app/(admin)/admin/user-management/page.tsx
import { withAnyPrivilegeRBAC } from '@/components/auth/withRBACAuth';

function UserManagementPage() {
  // Page content
}

export default withAnyPrivilegeRBAC(UserManagementPage, [
  'VIEW_USER_LIST', 
  'CREATE_USER', 
  'UPDATE_USER', 
  'DELETE_USER'
]);
```

### 2. Component-Level Permissions

```typescript
import { useRBAC } from '@/hooks/useRBAC';
import Permission from '@/components/auth/Permission';

function UserList() {
  const { hasPrivilege } = useRBAC();

  return (
    <div>
      <h1>Users</h1>
      
      {/* Show create button only if user has CREATE_USER privilege */}
      <Permission privilege="CREATE_USER">
        <button onClick={createUser}>Create User</button>
      </Permission>

      {/* Show delete button only for admins */}
      <Permission role={1}>
        <button onClick={deleteUser}>Delete User</button>
      </Permission>

      {/* Conditional rendering using hooks */}
      {hasPrivilege('UPDATE_USER') && (
        <button onClick={editUser}>Edit User</button>
      )}
    </div>
  );
}
```

### 3. Menu Filtering

The sidebar automatically filters menu items based on user permissions:

```typescript
// app/src/layout/AppSidebar.tsx
const { canAccessRoute } = useRBAC();

const filteredNavItems = navItems.filter(item => {
  return canAccessRoute(item.path);
});
```

## API Integration

### User Data Structure

Ensure your user object includes the necessary RBAC fields:

```typescript
interface User {
  id: string;
  role: number;           // 0=user, 1=admin, 2=manager
  privileges: string[];   // Array of privilege names
  // other user fields...
}
```

### API Response Mapping

When fetching user data, map the API response to the expected format:

```typescript
// Example API response transformation
const mapApiUserToRBACUser = (apiUser: any): User => ({
  id: apiUser.id,
  role: apiUser.role_id,
  privileges: apiUser.user_privileges || [],
  // other mappings...
});
```

### Privilege Management API

The system expects privilege data in this format:

```json
{
  "count": 16,
  "results": [
    {
      "id": 1,
      "privilege_name": "CREATE_ROLE",
      "privilege_desc": "New Role is created successfully!",
      "module_id": "10"
    }
  ]
}
```

## Migration Guide

### From Legacy Access Control

1. **Update HOC Usage**:
   ```typescript
   // Old
   import { withAdminAuth } from '@/components/auth/withAuth';
   export default withAdminAuth(MyComponent);

   // New
   import { withAdminRBAC } from '@/components/auth/withRBACAuth';
   export default withAdminRBAC(MyComponent);
   ```

2. **Replace Role Checks**:
   ```typescript
   // Old
   if (user?.role === 'admin') {
     // admin logic
   }

   // New
   const { isAdmin } = useRBAC();
   if (isAdmin()) {
     // admin logic
   }
   ```

3. **Update Permission Checks**:
   ```typescript
   // Old
   if (user?.accessControl?.includes('user-management')) {
     // access granted
   }

   // New
   const { canAccessRoute } = useRBAC();
   if (canAccessRoute('/admin/user-management')) {
     // access granted
   }
   ```

## Best Practices

### 1. Security-First Approach

- Always protect routes at the page level using HOCs
- Use both server-side and client-side validation
- Implement principle of least privilege

### 2. Consistent Permission Naming

- Use descriptive, action-based privilege names
- Follow the pattern: `ACTION_RESOURCE` (e.g., `CREATE_USER`, `VIEW_ROLE_LIST`)
- Group related privileges by module

### 3. Granular Access Control

- Define permissions at the smallest functional unit
- Use module-based organization for scalability
- Implement both role-based and privilege-based checks

### 4. Performance Optimization

- Use React hooks to avoid prop drilling
- Memoize permission checks where possible
- Cache module definitions

### 5. Error Handling

- Provide clear feedback for access denied scenarios
- Log permission violations for security monitoring
- Implement graceful fallbacks

## Troubleshooting

### Common Issues

1. **Access Denied for Valid Users**
   - Check if user has required privileges in database
   - Verify module definitions in `modules.json`
   - Ensure API response includes privilege data

2. **Menu Items Not Filtering**
   - Verify route paths match module definitions
   - Check if `canAccessRoute` function is working correctly
   - Debug with console.log in sidebar filtering logic

3. **HOC Not Redirecting Properly**
   - Ensure AuthContext is providing user data
   - Check if route paths are correctly defined
   - Verify redirect logic in withRBACAuth

4. **Performance Issues**
   - Check for unnecessary re-renders in permission hooks
   - Optimize memoization in RBAC utilities
   - Review component structure for permission checks

### Debugging Tools

1. **RBAC Hook Debugging**:
   ```typescript
   const { userRole, userPrivileges, canAccessRoute } = useRBAC();
   console.log('User Role:', userRole);
   console.log('User Privileges:', userPrivileges);
   console.log('Can Access Route:', canAccessRoute('/admin/user-management'));
   ```

2. **Permission Component Debugging**:
   ```typescript
   <Permission 
     privilege="CREATE_USER"
     fallback={<div>Debug: CREATE_USER privilege required</div>}
   >
     <CreateUserButton />
   </Permission>
   ```

3. **Module Information**:
   ```typescript
   import { getModuleInfo, getAllModules } from '@/utils/rbacUtils';
   console.log('Module Info:', getModuleInfo('60'));
   console.log('All Modules:', getAllModules());
   ```

## Future Enhancements

1. **Dynamic Permission Loading**: Load permissions from API instead of static JSON
2. **Permission Caching**: Implement Redis-based permission caching
3. **Audit Logging**: Track permission checks and access attempts
4. **Advanced Rules Engine**: Support for complex permission combinations
5. **Real-time Updates**: WebSocket-based permission updates

## Conclusion

The RBAC system provides a robust, scalable solution for managing user permissions in the application. By following this guide and best practices, you can implement secure, maintainable access control that grows with your application's needs.

For additional support or questions, refer to the codebase documentation or contact the development team.
