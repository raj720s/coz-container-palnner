# Server API Integration Guide

## Overview

The RBAC system has been successfully integrated with the real server API endpoint `/api/admin/v1/privilege/list` to provide server-driven access control with static fallback capabilities.

## API Integration Details

### **Endpoint Used**
```
POST /api/admin/v1/privilege/list
```

### **Request Format**
```json
{
  "role_id": 2
}
```

### **Response Format**
```json
{
  "count": 16,
  "results": [
    {
      "module_id": "10",
      "privileges": [
        {
          "id": 1,
          "privilege_name": "CREATE_ROLE",
          "privilege_desc": "New Role is created successfully!"
        },
        {
          "id": 5,
          "privilege_name": "DELETE_ROLE",
          "privilege_desc": "Role is deleted!"
        }
      ]
    },
    {
      "module_id": "20",
      "privileges": [
        {
          "id": 6,
          "privilege_name": "VIEW_PRIVILEGE_LIST",
          "privilege_desc": "Viewed all permission list!"
        }
      ]
    }
  ]
}
```

## Implementation Architecture

### **1. Server-First Approach**
- **Primary Data Source**: Server API endpoint
- **Fallback Mechanism**: Static module definitions
- **Error Handling**: Graceful degradation to static data
- **Performance**: Efficient caching and parallel requests

### **2. Data Flow**
```
User Login → Fetch Role Data → Server API Call → Extract Modules/Privileges → Map to Routes → Create User Object
```

### **3. Key Methods Updated**

#### **`getRolePrivileges(roleId: number)`**
- Calls `/api/admin/v1/privilege/list` with role_id
- Extracts privilege names from module-wise structure
- Returns array of privilege strings

#### **`getRoleModules(roleId: number)`**
- Calls `/api/admin/v1/privilege/list` with role_id
- Extracts module IDs from response
- Returns array of module numbers

#### **`getRoleRoutes(roleId: number)`**
- Gets modules from server
- Maps modules to routes using static definitions
- Returns array of accessible routes

#### **`getAllPrivileges()`**
- Fetches privileges for roles 1, 2, 3
- Builds comprehensive privilege list
- Returns unique privileges with IDs

#### **`getAllModules()`**
- Fetches modules for roles 1, 2, 3
- Maps server modules to static definitions
- Returns module customization objects

## Module Mapping

### **Server Module IDs to Static Modules**
```typescript
const moduleMapping = {
  10: "Role Management",
  20: "Privilege Management", 
  30: "Role Permission Management",
  40: "Port & Customer Management",
  50: "Shipment Operations",
  60: "User Management",
  70: "System Administration",
  80: "Dashboard"
};
```

### **Route Mapping**
- Server provides module IDs
- Static definitions provide routes for each module
- System maps server modules to accessible routes
- Routes are filtered based on user role (admin vs user)

## Usage Examples

### **Basic Usage**
```typescript
const { user, modules, permissions, routes, can, canAccessModule } = useSimplifiedAuth();

// Check module access
if (canAccessModule(60)) {
  // User can access User Management module
}

// Check privilege
if (can('CREATE_USER')) {
  // User can create users
}

// Check route access
if (canVisit('/admin/user-management')) {
  // User can visit user management page
}
```

### **HOC Protection**
```typescript
// Protect by module
export default withModuleAccess(MyComponent, [60], {
  fallbackComponent: () => <div>No access to User Management</div>
});

// Protect by privilege
export default withPrivilege(MyComponent, 'CREATE_USER', {
  fallbackComponent: () => <div>No permission to create users</div>
});

// Protect by route
export default withRouteAccess(MyComponent, '/admin/user-management', {
  fallbackComponent: () => <div>No access to this page</div>
});
```

### **Server Data Loading**
```typescript
// Load server data directly
const loadServerData = async () => {
  const [modules, privileges, routes] = await Promise.all([
    simplifiedRBACService.getAllModules(),
    simplifiedRBACService.getAllPrivileges(),
    simplifiedRBACService.getAllRoutes()
  ]);
  
  console.log('Server data loaded:', { modules, privileges, routes });
};
```

## Error Handling

### **Server Unavailable**
- System automatically falls back to static data
- User experience remains uninterrupted
- Clear logging indicates fallback usage

### **API Errors**
- Network errors are caught and handled
- Invalid responses trigger fallback
- User-friendly error messages displayed

### **Data Validation**
- Server responses are validated before processing
- Invalid module IDs are filtered out
- Missing privileges are handled gracefully

## Performance Optimizations

### **Parallel Requests**
```typescript
const [privileges, routes, modules] = await Promise.all([
  simplifiedRBACService.getRolePrivileges(roleId),
  simplifiedRBACService.getRoleRoutes(roleId),
  simplifiedRBACService.getRoleModules(roleId)
]);
```

### **Caching Strategy**
- Server data is cached in memory
- Static data serves as immediate fallback
- No unnecessary API calls for same role

### **Efficient Mapping**
- Module-to-route mapping uses static definitions
- No server calls needed for route resolution
- Fast privilege checking with array methods

## Configuration

### **Environment Variables**
```typescript
// .env.local
RBAC_SERVER_URL=http://192.168.0.128:8003
RBAC_USE_SERVER=true
RBAC_FALLBACK_TO_STATIC=true
```

### **API Endpoint Configuration**
```typescript
const API_ENDPOINTS = {
  PRIVILEGE_LIST: '/api/admin/v1/privilege/list',
  // Future endpoints can be added here
};
```

## Testing

### **Server Integration Test**
```typescript
// Test server connectivity
const testServerConnection = async () => {
  try {
    const privileges = await simplifiedRBACService.getRolePrivileges(2);
    console.log('Server connection successful:', privileges.length);
  } catch (error) {
    console.log('Server fallback triggered:', error.message);
  }
};
```

### **Fallback Test**
```typescript
// Test static fallback
const testFallback = async () => {
  // Simulate server error
  const originalFetch = window.fetch;
  window.fetch = () => Promise.reject(new Error('Server unavailable'));
  
  const privileges = await simplifiedRBACService.getRolePrivileges(2);
  console.log('Fallback data loaded:', privileges.length);
  
  // Restore fetch
  window.fetch = originalFetch;
};
```

## Benefits

### **Real-time Updates**
- RBAC changes on server take effect immediately
- No application restart required
- Dynamic permission management

### **Scalability**
- Easy to add new modules and privileges
- Server-side configuration management
- Centralized access control

### **Reliability**
- Graceful fallback ensures system always works
- Offline capability with static data
- Robust error handling

### **Performance**
- Efficient data loading with parallel requests
- Smart caching reduces API calls
- Fast privilege checking

## Future Enhancements

### **Additional API Endpoints**
- User management endpoints
- Role management endpoints
- Module management endpoints

### **Advanced Caching**
- Redis integration for server-side caching
- Client-side cache with TTL
- Background data refresh

### **Real-time Updates**
- WebSocket integration for live updates
- Event-driven permission changes
- Instant UI updates

## Troubleshooting

### **Common Issues**

1. **Server Not Responding**
   - Check network connectivity
   - Verify API endpoint URL
   - Check server logs

2. **Invalid Data Format**
   - Validate server response structure
   - Check module ID mappings
   - Verify privilege name formats

3. **Fallback Not Working**
   - Check static module definitions
   - Verify error handling logic
   - Test offline scenarios

### **Debug Tools**
- Browser console logging
- Network tab monitoring
- Server response inspection
- Component state debugging

This integration provides a robust, server-driven RBAC system that maintains reliability through static fallback while enabling real-time permission management.
