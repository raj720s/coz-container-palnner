# Access Control System Documentation

## Overview
The application implements a comprehensive access control system that manages user permissions and route access for both admin and user roles. This system ensures secure access to all pages and routes while maintaining flexibility for role-based permissions.

## System Architecture

### 1. **Route Definitions** (`/src/types/user.ts`)
All available routes in the application are defined in the `AVAILABLE_ROUTES` constant, categorized by access level:

#### **Admin Routes**
- `admin/dashboard` - Admin Dashboard
- `admin/user-management` - User Management
- `admin/container-types` - Container Types Management
- `admin/container-priority` - Container Priority Management
- `admin/container-thresholds` - Container Thresholds Management
- `admin/port-customer-master` - Port & Customer Master
- `admin/shipment-upload` - Shipment Upload
- `admin/container-planning` - Container Planning
- `admin/assignment-results` - Assignment Results
- `admin/repositioning-summary` - Repositioning Summary
- `admin/validation-summary` - Validation Summary
- `admin/test-validation` - Test Validation
- `admin/data-backup` - Data Backup
- `admin/system-settings` - System Settings
- `admin/shipment-operations/uploads-history` - Uploads History
- `admin/shipment-operations/shipment-history` - Shipment History

#### **User Routes**
- `user/dashboard` - User Dashboard
- `user/shipment-upload` - Shipment Upload
- `user/view-history` - View History
- `user/shipment-history` - Shipment History
- `user/container-planning` - Container Planning
- `user/assignment-results` - Assignment Results
- `user/validation-summary` - Validation Summary
- `user/test-validation` - Test Validation
- `user/repositioning-summary` - Repositioning Summary
- `user/data-backup` - Data Backup
- `user/test` - Test Page
- `user/input-file` - Input File Viewer
- `user/output-file` - Output File Viewer

#### **Public Routes**
- `` - Home Page
- `signin` - Sign In
- `signup` - Sign Up
- `error-404` - Error 404

### 2. **Default Role Access** (`/src/types/user.ts`)
Each role has predefined access to routes:

#### **Admin Role**
- Access to ALL admin routes
- Access to ALL user routes (can perform user functions)
- Access to ALL public routes

#### **User Role**
- Access to ALL user routes
- Access to ALL public routes
- NO access to admin routes

### 3. **Access Control Utilities** (`/src/utils/accessControl.ts`)

#### **Core Functions**
- `validateRouteAccess()` - Validates user access to specific routes
- `getAccessibleRoutesForUser()` - Gets all accessible routes for a user
- `canAccessRoutes()` - Checks access to multiple routes
- `generateAccessControlForRole()` - Generates default access control for roles
- `addRouteAccess()` / `removeRouteAccess()` - Manages individual route access

#### **Route Classification Functions**
- `isPublicRoute()` - Identifies public routes
- `isAdminRoute()` - Identifies admin-only routes
- `isUserRoute()` - Identifies user routes
- `getRequiredRoleForRoute()` - Determines required role for a route

#### **Access Validation Functions**
- `hasRouteAccess()` - Checks if user has access to a specific route
- `hasAdminAccess()` - Checks if user has any admin route access
- `hasUserAccess()` - Checks if user has any user route access
- `hasCategoryAccess()` - Checks access to route categories

### 4. **Authentication HOCs** (`/src/components/auth/withAuth.tsx`)

#### **Basic HOCs**
- `withAuth()` - Base authentication wrapper
- `withAdminAuth()` - Admin-only access
- `withUserAuth()` - User-only access
- `withAnyAuth()` - Any authenticated user

#### **Advanced HOCs**
- `withRouteAuth()` - Route-specific access control
- `withStrictAuth()` - Strict access control enforcement
- `withAdminRouteAuth()` - Admin-only with strict control
- `withUserRouteAuth()` - User-only with strict control

#### **Features**
- **Role-based Access Control**: Enforces user roles
- **Route-based Access Control**: Validates specific route access
- **Strict Access Control**: Enforces exact route matching
- **Automatic Redirects**: Redirects unauthorized users to appropriate dashboards
- **Console Logging**: Logs access violations for debugging

### 5. **Access Control Manager** (`/src/components/auth/AccessControlManager.tsx`)
A comprehensive admin interface for managing user access control:

#### **Features**
- **User Management**: Create, edit, delete users
- **Role Management**: Change user roles
- **Access Control**: Granular route permission management
- **Visual Indicators**: Clear status display for each route
- **Real-time Updates**: Immediate access control modifications

#### **Route Status Display**
- **Granted**: User has explicit access (Green)
- **Denied**: User cannot access due to role restrictions (Red)
- **Available**: User can access but doesn't have explicit permission (Blue/Gray)

## Implementation Examples

### **Basic Route Protection**
```tsx
// Admin-only route
export default withAdminAuth(AdminDashboard);

// User-only route
export default withUserAuth(UserDashboard);

// Any authenticated user
export default withAnyAuth(SharedPage);
```

### **Route-Specific Access Control**
```tsx
// Require specific route access
export default withRouteAuth(SpecialFeature, "admin/advanced-feature");

// Strict access control
export default withStrictAuth(AdminOnlyFeature, { requiredRole: "admin" });
```

### **Custom Access Control**
```tsx
// Custom authentication logic
export default withAuth(ProtectedPage, {
  requiredRole: "admin",
  requiredRoute: "admin/sensitive-data",
  strictAccessControl: true
});
```

## Security Features

### **1. Multi-Layer Protection**
- **Authentication Layer**: Ensures user is logged in
- **Role Layer**: Enforces role-based access
- **Route Layer**: Validates specific route permissions
- **Access Control Layer**: Checks user's explicit permissions

### **2. Automatic Security Measures**
- **Unauthorized Access Prevention**: Blocks access to restricted routes
- **Automatic Redirects**: Redirects users to appropriate dashboards
- **Access Violation Logging**: Logs security violations for monitoring
- **Session Validation**: Validates user sessions on each route access

### **3. Data Isolation**
- **User Data Separation**: Users can only access their own data
- **Role-Based Data Access**: Admins can access all data, users only their own
- **Route-Level Isolation**: Different routes have different access requirements

## Usage Guidelines

### **For Developers**

#### **Adding New Routes**
1. Add route to `AVAILABLE_ROUTES` in `/src/types/user.ts`
2. Add route to appropriate role in `DEFAULT_ROLE_ACCESS`
3. Protect route with appropriate HOC
4. Test access control functionality

#### **Modifying Access Control**
1. Use `AccessControlManager` for admin interface
2. Modify `DEFAULT_ROLE_ACCESS` for role changes
3. Update individual user `accessControl` arrays
4. Test with different user roles

### **For Administrators**

#### **Managing User Access**
1. Access the Access Control Manager
2. Select user to modify
3. Change role or individual route permissions
4. Save changes

#### **Creating New Users**
1. Use Create User form
2. Assign appropriate role
3. Customize route access if needed
4. Set initial permissions

### **For Users**
- Users automatically get access to routes based on their role
- Access is managed by administrators
- Users cannot modify their own permissions

## Testing and Validation

### **Access Control Testing**
- [x] Test admin access to admin routes
- [x] Test user access to user routes
- [x] Test admin access to user routes
- [x] Test user access denial to admin routes
- [x] Test public route access
- [x] Test unauthorized access redirects
- [x] Test role-based access enforcement

### **Security Testing**
- [x] Test authentication bypass attempts
- [x] Test role escalation attempts
- [x] Test route access manipulation
- [x] Test session validation
- [x] Test access control integrity

## Best Practices

### **1. Security**
- Always use appropriate HOCs for route protection
- Validate access control on both client and server side
- Log access violations for security monitoring
- Regularly review and update user permissions

### **2. Performance**
- Cache access control data when possible
- Minimize access control checks on frequently accessed routes
- Use efficient route validation algorithms

### **3. Maintenance**
- Keep route definitions up to date
- Document access control changes
- Regular security audits of user permissions
- Monitor access patterns for anomalies

## Troubleshooting

### **Common Issues**

#### **Access Denied Errors**
- Check user role and permissions
- Verify route is in user's access control list
- Check if route requires specific role
- Validate user authentication status

#### **Route Not Found**
- Ensure route is defined in `AVAILABLE_ROUTES`
- Check route spelling and case sensitivity
- Verify route is added to appropriate role access

#### **Permission Changes Not Taking Effect**
- Clear user session and re-authenticate
- Check if changes were saved properly
- Verify access control array updates
- Check browser console for errors

## Future Enhancements

### **Planned Features**
- **Dynamic Route Permissions**: Runtime permission changes
- **Permission Groups**: Group-based access control
- **Temporary Access**: Time-limited route access
- **Audit Trail**: Complete access control change history
- **API Integration**: External permission management systems

### **Scalability Improvements**
- **Permission Caching**: Redis-based permission caching
- **Batch Operations**: Bulk permission updates
- **Permission Templates**: Predefined permission sets
- **Automated Provisioning**: Role-based automatic permission assignment

## Conclusion

The access control system provides comprehensive security and flexibility for managing user access to application routes. It ensures that:

1. **All routes are properly protected** with appropriate authentication and authorization
2. **Role-based access control** is enforced consistently across the application
3. **Granular permissions** can be managed at the route level
4. **Security violations** are logged and prevented automatically
5. **Administrators** have full control over user access and permissions
6. **Users** can only access routes appropriate to their role and permissions

This system maintains the balance between security and usability while providing administrators with powerful tools for managing user access control.
