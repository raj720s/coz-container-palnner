# 🔐 RBAC Migration Guide

## Overview

This guide shows how to migrate from the current `withRouteAuth` system to the new enhanced RBAC system using `withRBACAuth`.

## Migration Steps

### 1. Route Protection Migration

#### **Before (Old System):**
```typescript
// app/src/app/(admin)/admin/container-priority/ContainerPriorityClient.tsx
export default withRouteAuth(ContainerPriorityPage, "admin/container-priority");
```

#### **After (New RBAC System):**
```typescript
// Option 1: Use route-based protection
export default withRBACAuth(ContainerPriorityPage, { 
  route: "admin/container-priority" 
});

// Option 2: Use privilege-based protection (recommended)
export default withRBACAuth(ContainerPriorityPage, { 
  privilege: "VIEW_CONTAINER_PRIORITY" 
});

// Option 3: Use convenience HOC
export default withViewAccess(ContainerPriorityPage, "VIEW_CONTAINER_PRIORITY");
```

### 2. Action-Level Permissions

#### **Add CRUD Permissions:**
```typescript
// For pages with create/edit/delete actions
export default withRBACAuth(ContainerPriorityPage, { 
  anyPrivileges: ["VIEW_CONTAINER_PRIORITY", "CREATE_PRIORITY", "UPDATE_PRIORITY", "DELETE_PRIORITY"] 
});

// Or use convenience HOC
export default withCRUDAccess(ContainerPriorityPage, "priority", ["create", "read", "update", "delete"]);
```

### 3. UI Component Integration

#### **Conditional Button Rendering:**
```typescript
// Before: Always show button, handle in onClick
<Button onClick={handleCreate}>Add Priority</Button>

// After: Only show if user has permission
<ProtectedButton 
  action="create_priority" 
  onClick={handleCreate}
  variant="primary"
>
  Add Priority
</ProtectedButton>

// Or using privilege
<ConditionalRender privilege="CREATE_PRIORITY">
  <Button onClick={handleCreate}>Add Priority</Button>
</ConditionalRender>
```

#### **Conditional Action Columns:**
```typescript
// In table column definitions
const columns = [
  // ... other columns
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <ConditionalRender privilege="UPDATE_PRIORITY">
          <Button onClick={() => handleEdit(row.original)}>Edit</Button>
        </ConditionalRender>
        
        <ConditionalRender privilege="DELETE_PRIORITY">
          <Button 
            onClick={() => handleDelete(row.original)} 
            variant="danger"
          >
            Delete
          </Button>
        </ConditionalRender>
      </div>
    ),
  },
];
```

### 4. Navigation Menu Protection

#### **Protect Menu Items:**
```typescript
// In sidebar or navigation components
const menuItems = [
  {
    name: "Container Priority",
    href: "/admin/container-priority",
    component: (
      <ProtectedLink 
        href="/admin/container-priority"
        privilege="VIEW_CONTAINER_PRIORITY"
        className="nav-link"
      >
        Container Priority
      </ProtectedLink>
    )
  },
  // ... other items
];
```

### 5. Role-Based Content

#### **Show Different Content by Role:**
```typescript
// Different dashboards for different roles
<RoleBasedRender role={1}> {/* Admin */}
  <AdminDashboard />
</RoleBasedRender>

<RoleBasedRender role={0}> {/* User */}
  <UserDashboard />
</RoleBasedRender>

// Or use convenience components
<AdminOnly>
  <AdminSettings />
</AdminOnly>

<SuperUserOnly>
  <SystemMaintenance />
</SuperUserOnly>
```

## Backend Data Structure Recommendations

### 1. Privilege Naming Convention

Use a consistent naming pattern:
- **Format:** `{ACTION}_{RESOURCE}`
- **Examples:**
  - `VIEW_USER_LIST`
  - `CREATE_USER`
  - `UPDATE_USER`
  - `DELETE_USER`
  - `VIEW_CONTAINER_PRIORITY`
  - `CREATE_PRIORITY`
  - `UPDATE_PRIORITY`
  - `DELETE_PRIORITY`

### 2. Module-Based Grouping

Group privileges by modules for easier management:

```json
{
  "module_10": {
    "name": "Role Management",
    "privileges": [
      "CREATE_ROLE",
      "UPDATE_ROLE", 
      "DELETE_ROLE",
      "VIEW_ROLE",
      "VIEW_ROLE_LIST"
    ]
  },
  "module_20": {
    "name": "User Management", 
    "privileges": [
      "CREATE_USER",
      "UPDATE_USER",
      "DELETE_USER", 
      "VIEW_USER",
      "VIEW_USER_LIST"
    ]
  }
}
```

### 3. Role Response Structure

Ensure your `/api/admin/v1/role/list` endpoint returns:

```json
{
  "count": 6,
  "results": [
    {
      "id": 1,
      "role_name": "Admin",
      "role_description": "Full system access",
      "privilege_names": [
        "CREATE_ROLE",
        "UPDATE_ROLE",
        "DELETE_ROLE",
        "VIEW_ROLE_LIST",
        "CREATE_USER",
        "UPDATE_USER",
        "DELETE_USER",
        "VIEW_USER_LIST"
      ],
      "created_on": "2025-01-15T10:00:00Z",
      "modified_on": "2025-01-15T10:00:00Z",
      "created_by": 1,
      "modified_by": 1
    }
  ]
}
```

### 4. User Info Response Enhancement

Update `/api/user/v1/json-info` to include:

```json
{
  "id": 1,
  "email": "admin@company.com",
  "first_name": "Admin",
  "last_name": "User",
  "role_id": 1,
  "role_name": "Admin",
  "is_superuser": false,
  "privileges": [
    "CREATE_ROLE",
    "UPDATE_ROLE", 
    "DELETE_ROLE"
  ],
  "privilege_version": "1_2025-01-15T10:00:00Z_3"
}
```

## Implementation Checklist

### ✅ Backend Updates Required

1. **API Endpoints:**
   - [ ] Update `/api/admin/v1/role/list` to include `privilege_names`
   - [ ] Update `/api/user/v1/json-info` to include role and privilege info
   - [ ] Add privilege version tracking for change detection

2. **Database Schema:**
   - [ ] Ensure consistent privilege naming
   - [ ] Add privilege versioning mechanism
   - [ ] Group privileges by modules

### ✅ Frontend Updates Required

1. **Core RBAC System:**
   - [x] Enhanced Redux store for user privileges
   - [x] RBAC service for privilege checking
   - [x] Enhanced RBAC hooks
   - [x] Updated withRBACAuth HOC

2. **UI Components:**
   - [x] ConditionalRender component
   - [x] ProtectedButton component
   - [x] ProtectedLink component
   - [x] Role-based render components

3. **Route Migration:**
   - [ ] Replace `withRouteAuth` with `withRBACAuth`
   - [ ] Add privilege-based protection
   - [ ] Update all page components

4. **Action-Level Permissions:**
   - [ ] Add CRUD operation protection
   - [ ] Update table action columns
   - [ ] Protect form submission buttons

### ✅ Testing & Validation

1. **Functionality Testing:**
   - [ ] Test route access with different roles
   - [ ] Test action permissions (CRUD operations)
   - [ ] Test privilege change detection
   - [ ] Test re-login flow

2. **UI Testing:**
   - [ ] Verify buttons show/hide correctly
   - [ ] Verify menu items filter properly
   - [ ] Test loading states
   - [ ] Test error states

## Example File Updates

### Container Priority Page Migration

```typescript
// app/src/app/(admin)/admin/container-priority/ContainerPriorityClient.tsx

// Before
export default withRouteAuth(ContainerPriorityPage, "admin/container-priority");

// After
export default withRBACAuth(ContainerPriorityPage, {
  anyPrivileges: ["VIEW_CONTAINER_PRIORITY", "CREATE_PRIORITY", "UPDATE_PRIORITY", "DELETE_PRIORITY"],
  route: "admin/container-priority"
});
```

### Button Protection Example

```typescript
// In the component JSX
<div className="flex gap-2">
  <ProtectedButton
    privilege="CREATE_PRIORITY"
    onClick={() => setModalOpen(true)}
    variant="primary"
  >
    Add Priority
  </ProtectedButton>
  
  <ConditionalRender privilege="EXPORT_DATA">
    <Button onClick={handleExport} variant="secondary">
      Export
    </Button>
  </ConditionalRender>
</div>
```

### Table Actions Example

```typescript
// In column definition
{
  id: "actions",
  header: "Actions",
  cell: ({ row }) => (
    <div className="flex gap-1">
      <ActionBasedRender action="update_priority">
        <Button
          size="sm"
          onClick={() => handleEdit(row.original)}
        >
          Edit
        </Button>
      </ActionBasedRender>
      
      <ActionBasedRender action="delete_priority">
        <Button
          size="sm"
          variant="danger"
          onClick={() => handleDelete(row.original)}
        >
          Delete
        </Button>
      </ActionBasedRender>
    </div>
  ),
}
```

## Benefits of New RBAC System

1. **🔐 Enhanced Security:** Granular privilege-based access control
2. **🚀 Real-time Updates:** Automatic privilege change detection
3. **🎯 Action-Level Control:** Protect individual CRUD operations
4. **🔄 Session Management:** Automatic re-login prompts when privileges change
5. **🧩 Modular Components:** Reusable RBAC-aware UI components
6. **📊 Better UX:** Conditional rendering reduces confusion
7. **🛠️ Developer Experience:** Type-safe privilege checking
8. **📈 Scalability:** Easy to add new privileges and roles

## Next Steps

1. **Phase 1:** Implement backend API changes
2. **Phase 2:** Migrate critical pages (user management, role management)
3. **Phase 3:** Migrate remaining pages
4. **Phase 4:** Add action-level permissions to all CRUD operations
5. **Phase 5:** Testing and optimization

This new RBAC system provides a robust foundation for managing user permissions while maintaining a smooth user experience and enabling fine-grained access control! 🎉
