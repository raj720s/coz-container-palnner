# 🎯 **RBAC Module Integration Guide - Simplified Architecture**

## 📋 **Overview**

This guide explains how to integrate the **simplified module-based RBAC architecture** that matches your server requirements:

- **No role-based divisions** in modules
- **Unified routes** (admin + user) in single arrays
- **Simple privilege-to-module mapping** via `module_id`
- **Server integration** with `privilege_names[]` arrays

## 🏗️ **Architecture Components**

### **1. Static Module Definitions (`staticModules.ts`)**

```typescript
export interface StaticModule {
  id: number;                    // Static module ID (10, 20, 30, etc.)
  name: string;                  // Module name
  description: string;           // Module description
  icon: string;                  // Module icon
  color: string;                 // Module color
  routes: string[];              // ALL routes (admin + user) in single array
  privileges: string[];          // ALL privileges for this module
  subModules?: StaticSubModule[];
}
```

**Example Module:**
```typescript
40: {
  id: 40,
  name: "Port & Customer Management",
  routes: [
    "/admin/port-customer-master",
    "/admin/port-customer-master/customers",
    "/user/port-customer-master",
    "/user/port-customer-master/customers"
  ],
  privileges: [
    "VIEW_PORT_CUSTOMER_MASTER",
    "CREATE_CUSTOMER",
    "UPDATE_CUSTOMER",
    "DELETE_CUSTOMER"
  ]
}
```

### **2. Server Integration Format**

#### **Privileges from Server:**
```json
{
  "id": "6822e51690dd498ff609a9d0",
  "privilege_name": "UPDATE_APPLICATION",
  "privilege_desc": "Specific Application Updated!",
  "module_id": 40
}
```

#### **Roles from Server:**
```json
{
  "id": "68397eeed13092866de75ee9",
  "role_name": "Super Admin",
  "role_description": "All Privileges",
  "privilege_names": [
    "UPDATE_APPLICATION",
    "CREATE_USER",
    "DELETE_ROLE"
  ]
}
```

### **3. Enhanced Role Management Interfaces**

```typescript
export interface CreateRoleRequestV2 {
  role_name: string;
  role_description: string;
  privilege_names: string[];        // Array of privilege names
  application_id?: string;
  application_name?: string;
}

export interface RoleResponseV2 {
  id: string;
  role_name: string;
  role_description: string;
  privilege_names: string[];        // Array of privilege names
  // ... other fields
}
```

## 🔧 **Integration Steps**

### **Step 1: Update Role Management Client**

Replace the existing `RoleForm` with `EnhancedRoleForm`:

```typescript
// app/src/app/(admin)/admin/role-management/Client.tsx
import { EnhancedRoleForm } from "@/components/forms/EnhancedRoleForm";

// Replace the existing form with:
<EnhancedRoleForm
  initialData={editingItem}
  privileges={privileges}
  onSubmit={handleCreateRole}
  isLoading={isModalLoading}
  onCancel={closeModal}
/>
```

### **Step 2: Update Role Service**

Ensure your role service uses the new interfaces:

```typescript
// app/src/services/roleService.ts
import { 
  CreateRoleRequestV2, 
  UpdateRoleRequestV2, 
  RoleResponseV2 
} from './roleService';

// Update your service methods to use V2 interfaces
async createRole(roleData: CreateRoleRequestV2): Promise<RoleResponseV2> {
  // Implementation
}
```

### **Step 3: Update RBAC Hook**

The existing `useSimpleRBAC` hook already works with the simplified structure:

```typescript
// app/src/hooks/useSimpleRBAC.ts
// No changes needed - already uses staticModuleDefinitions.modules
```

## 📱 **Enhanced Role Form Features**

### **1. Module-Based Privilege Selection**

- **Collapsible modules** with expand/collapse functionality
- **Visual module identification** with colors and icons
- **Module-specific privilege selection** (Select All/Clear for each module)
- **Search and filter** by module or privilege name

### **2. Privilege Management**

- **Checkbox selection** for individual privileges
- **Bulk operations** (Select All, Clear All)
- **Real-time summary** of selected privileges
- **Validation** to ensure at least one privilege is selected

### **3. User Experience**

- **Responsive design** with mobile-friendly interface
- **Visual feedback** for selected privileges
- **Toast notifications** for user actions
- **Loading states** during form submission

## 🚀 **Usage Examples**

### **Creating a New Role**

```typescript
const handleCreateRole = async (roleData: CreateRoleRequestV2) => {
  try {
    const response = await roleService.createRole({
      role_name: "Data Manager",
      role_description: "Manages data operations and reports",
      privilege_names: [
        "VIEW_PORT_CUSTOMER_MASTER",
        "CREATE_CUSTOMER",
        "UPDATE_CUSTOMER",
        "VIEW_ASSIGNMENT_RESULTS",
        "EXPORT_ASSIGNMENT_DATA"
      ]
    });
    
    toast.success('Role created successfully');
    refreshRoles();
  } catch (error) {
    toast.error('Failed to create role');
  }
};
```

### **Checking Module Access**

```typescript
import { hasModuleAccess } from '@/utils/modulePrivilegeUtils';

const canAccessPortManagement = hasModuleAccess(40, userPrivileges);
const canAccessAnalytics = hasModuleAccess(60, userPrivileges);
```

### **Getting Module Information**

```typescript
import { getModuleInfo, getModuleRoutes } from '@/utils/modulePrivilegeUtils';

const portModule = getModuleInfo(40);
const portRoutes = getModuleRoutes(40);
```

## 🔒 **Security & Access Control**

### **1. Route Protection**

The existing `withSimpleRBAC` component automatically protects routes based on module privileges:

```typescript
export default withSimpleRBAC(PolDataManager, {
  privilege: "VIEW_POL_PORTS",  // Must have this privilege
  role: [1, 2, 3],             // Must have one of these roles
  allowSuperUserBypass: true
});
```

### **2. Module Access Validation**

```typescript
// Check if user can access a specific module
const canAccessModule = (moduleId: number): boolean => {
  const module = staticModuleDefinitions.modules[moduleId];
  if (!module) return false;
  
  return userPrivileges.some(privilege => 
    module.privileges.includes(privilege)
  );
};
```

### **3. Privilege Inheritance**

Sub-modules inherit privileges from parent modules:

```typescript
// Module 40 (Port & Customer) has DELETE_CUSTOMER
// Sub-module 43 (Customer Records) also has DELETE_CUSTOMER
// User with DELETE_CUSTOMER can access both
```

## 📊 **Data Flow**

### **1. Server → Client**

```
Server Privileges → Client Privileges → Module Mapping → Role Form
     ↓                    ↓                ↓            ↓
module_id: 40    →  Filter by 40   →  Show Module  →  User Selects
privilege_name   →  privilege_name →  privileges   →  privileges
```

### **2. Client → Server**

```
Role Form → Selected Privileges → API Call → Server Storage
    ↓              ↓                ↓           ↓
User selects   →  privilege_names[] → POST /role → Database
privileges     →  role_name         → role_data  → Saved
```

### **3. Access Control**

```
User Login → Load Privileges → Route Access → Component Render
    ↓            ↓              ↓            ↓
Auth Token → privilege_names[] → Check → Allow/Deny
```

## 🧪 **Testing & Validation**

### **1. Module Privilege Mapping**

```typescript
// Test if privilege belongs to correct module
import { validatePrivilegeModuleMapping } from '@/utils/modulePrivilegeUtils';

const isValid = validatePrivilegeModuleMapping(
  "DELETE_CUSTOMER", 
  40, 
  serverPrivileges
);
// Should return true if DELETE_CUSTOMER belongs to module 40
```

### **2. Role Creation**

```typescript
// Test role creation with module-based privileges
const testRole = {
  role_name: "Test Role",
  role_description: "Test description",
  privilege_names: ["VIEW_CUSTOMERS", "CREATE_CUSTOMER"]
};

// Verify privileges belong to valid modules
const validPrivileges = testRole.privilege_names.every(privilegeName => {
  const privilege = serverPrivileges.find(p => p.privilege_name === privilegeName);
  return privilege && staticModuleDefinitions.modules[privilege.module_id];
});
```

## 🔄 **Migration from Current System**

### **1. Update Existing Roles**

```typescript
// Convert existing role data to new format
const migrateRole = (oldRole: RoleResponse): CreateRoleRequestV2 => ({
  role_name: oldRole.role_name,
  role_description: oldRole.role_description,
  privilege_names: oldRole.privilege_names,
  application_id: "your-app-id",
  application_name: "COZMOS"
});
```

### **2. Update Privilege Data**

```typescript
// Ensure all privileges have correct module_id
const validatePrivileges = (privileges: PrivilegeItemV2[]) => {
  return privileges.every(privilege => {
    const module = staticModuleDefinitions.modules[privilege.module_id];
    return module && module.privileges.includes(privilege.privilege_name);
  });
};
```

## 📈 **Benefits of This Architecture**

### **1. Simplicity**
- **No complex role-based divisions**
- **Single source of truth** for module definitions
- **Clear privilege-to-module mapping**

### **2. Scalability**
- **Easy to add new modules** and privileges
- **Consistent structure** across the application
- **Future-proof** for additional features

### **3. Maintainability**
- **Centralized module definitions**
- **Easy to update** routes and privileges
- **Clear documentation** and structure

### **4. User Experience**
- **Intuitive privilege selection** by module
- **Visual feedback** and organization
- **Efficient bulk operations**

## 🎯 **Next Steps**

1. **Review and approve** the simplified architecture
2. **Update role management** to use `EnhancedRoleForm`
3. **Test module privilege mapping** with your server data
4. **Validate access control** across different user roles
5. **Deploy and monitor** the enhanced system

This simplified architecture provides a clean, maintainable, and scalable solution for your RBAC requirements while maintaining full compatibility with your server-side privilege management system.
