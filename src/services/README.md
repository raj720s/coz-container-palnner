# User Management & Role Management Services

This directory contains comprehensive services for managing users and roles through external APIs, built with TypeScript and following DRY principles.

## 🏗️ Architecture

### Base Service (`BaseService`)
- **Abstract class** providing common HTTP methods (GET, POST, PUT, DELETE, PATCH)
- **Error handling** with consistent error formatting
- **Parameter validation** and cleaning
- **Retry logic** with exponential backoff
- **Path building** utilities for clean endpoint construction

### User Service (`UserService`)
- **CRUD operations** for user management
- **Advanced filtering** and search capabilities
- **Organization-based** user queries
- **Role-based** user queries
- **Superuser management** functionality

### Role Service (`RoleService`)
- **CRUD operations** for role management
- **Privilege management** (assign/remove privileges)
- **User-role relationships** queries
- **Bulk operations** for efficiency
- **Statistics** and reporting

## 🚀 Quick Start

### Import Services
```typescript
import { userService, roleService } from '@/services';
```

### Basic User Operations
```typescript
// Create a user
const newUser = await userService.createUser({
  status: true,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  organisation_name: 'Example Corp',
  role: 1
});

// Get user by ID
const user = await userService.getUser(123);

// Update user
const updatedUser = await userService.updateUser(123, {
  first_name: 'Jane',
  email: 'jane.doe@example.com'
});

// Delete user
await userService.deleteUser(123);
```

### Basic Role Operations
```typescript
// Create a role
const newRole = await roleService.createRole({
  name: 'Admin',
  description: 'Administrator role',
  privileges: [1, 2, 3, 4],
  is_active: true
});

// Get role by ID
const role = await roleService.getRole(456);

// Update role
const updatedRole = await roleService.updateRole(456, {
  description: 'Updated administrator role'
});

// Delete role
await roleService.deleteRole(456);
```

## 📋 API Endpoints

### User Management
| Operation | Endpoint | Method | Description |
|-----------|----------|--------|-------------|
| Create User | `/user/v1` | POST | Create new user |
| Get User | `/user/v1/{id}` | GET | Get user by ID |
| Update User | `/user/v1/{id}` | PUT | Update user |
| Delete User | `/user/v1/{id}` | DELETE | Delete user |
| List Users | `/user/v1/list` | GET | Get users with filtering |
| User Detail | `/user/v1/detail/{id}` | GET | Get detailed user info |
| User Short Info | `/user/v1/short-info/{id}` | GET | Get basic user info |
| Superuser Modify | `/user/v1/superuser/modify/{id}` | PUT | Modify superuser status |

### Role Management
| Operation | Endpoint | Method | Description |
|-----------|----------|--------|-------------|
| Create Role | `/admin/v1/role` | POST | Create new role |
| Get Role | `/admin/v1/role/{id}` | GET | Get role by ID |
| Update Role | `/admin/v1/role/{id}` | PUT | Update role |
| Delete Role | `/admin/v1/role/{id}` | DELETE | Delete role |
| List Roles | `/admin/v1/role/list` | GET | Get roles with filtering |
| Privilege List | `/admin/v1/privilege/list` | GET | Get all privileges |
| Role Users | `/admin/v1/role/user` | GET | Get users assigned to role |

## 🔧 Advanced Features

### Filtering & Pagination
```typescript
// Get users with filters
const users = await userService.getUsers({
  page: 1,
  limit: 20,
  search: 'john',
  role: 1,
  organisation: 'Example Corp',
  status: true
});

// Get roles with filters
const roles = await roleService.getRoles({
  page: 1,
  limit: 20,
  search: 'admin',
  is_active: true
});
```

### Search Functionality
```typescript
// Search users
const searchResults = await userService.searchUsers('john', 10);

// Search roles
const roleResults = await roleService.searchRoles('admin', 10);
```

### Bulk Operations
```typescript
// Bulk update user status
await userService.bulkUpdateUserStatus([1, 2, 3], false);

// Bulk update role status
await roleService.bulkUpdateRoleStatus([1, 2, 3], false);
```

### Privilege Management
```typescript
// Assign privileges to role
await roleService.assignPrivilegesToRole(1, [1, 2, 3]);

// Remove privileges from role
await roleService.removePrivilegesFromRole(1, [4, 5]);
```

## 🛡️ Error Handling

All services use consistent error handling through the `BaseService`:

```typescript
try {
  const user = await userService.getUser(123);
} catch (error) {
  // Error is already formatted consistently
  console.error(error.message);
  
  // You can also check error type if needed
  if (error.message.includes('Failed to get user')) {
    // Handle specific error
  }
}
```

## 🔄 Retry Logic

The base service includes automatic retry logic with exponential backoff:

```typescript
// Automatic retry (3 attempts with exponential backoff)
const user = await userService.getUser(123);

// Custom retry configuration
const user = await userService.retryRequest(
  () => userService.getUser(123),
  5, // max retries
  2000 // base delay in ms
);
```

## 📊 Type Safety

All services are fully typed with TypeScript interfaces:

```typescript
import { 
  CreateUserRequest, 
  UserResponse, 
  UserDetailResponse,
  CreateRoleRequest,
  RoleResponse 
} from '@/types/api';

// Type-safe user creation
const userData: CreateUserRequest = {
  status: true,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  organisation_name: 'Example Corp',
  role: 1
};

const user: UserResponse = await userService.createUser(userData);
```

## 🧪 Testing

### Example Component
See `UserManagementExample.tsx` for a complete working example of how to use these services in a React component.

### Mock Data
The services work with the existing mock data structure and can be easily extended for testing.

## 🔌 Configuration

### Environment Variables
```bash
# Base URL for API calls
BASEURL=https://api.example.com
# or
NEXT_PUBLIC_BASE_URL=https://api.example.com
```

### SuperAxios Interceptor
The services use the existing `superAxios` interceptor which provides:
- Base URL configuration
- Request/response interceptors
- Language parameter handling
- Error handling

## 📈 Performance Features

- **Parallel requests** for related data
- **Parameter cleaning** to avoid unnecessary API calls
- **Caching** ready for future implementation
- **Bulk operations** for efficiency
- **Lazy loading** support through pagination

## 🔒 Security

- **Input validation** for required fields
- **Type safety** to prevent invalid data
- **Error sanitization** to avoid information leakage
- **Request timeout** handling

## 🚀 Future Enhancements

- [ ] Request caching with React Query/SWR
- [ ] Offline support with service workers
- [ ] Real-time updates with WebSockets
- [ ] Advanced filtering with GraphQL-like queries
- [ ] Batch operations for multiple entities
- [ ] Audit logging for all operations
