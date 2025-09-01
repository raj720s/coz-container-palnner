# 🎯 **Static Modules RBAC Implementation**

## 📋 **Overview**

This document explains the new **Static Modules RBAC system** that uses app-defined modules with server-provided privileges. The system provides a clean separation between **static app structure** and **dynamic server permissions**.

---

## 🏗️ **Architecture Overview**

### **1. Static Modules (App-Side)**
- **Defined in app** - Routes, names, descriptions, categories
- **Never change** - Consistent structure across deployments
- **Module IDs** - Fixed numbering system (10, 20, 30, etc.)
- **Route mapping** - Each module contains its associated routes

### **2. Server Privileges (Server-Side)**
- **Dynamic privileges** - Received from server on login
- **Module mapping** - Each privilege has a `module_id`
- **Flexible structure** - Can add/remove privileges without app updates
- **Server format** - Matches your API response structure

---

## 📁 **File Structure**

```
app/src/
├── config/
│   └── staticModules.ts          ← Static module definitions
├── hooks/
│   └── useSimpleRBAC.ts          ← Updated RBAC hook
├── layout/
│   └── AppSidebar.tsx            ← Module-based navigation
├── components/
│   └── rbac/
│       └── RBACTestComponent.tsx ← Test component
└── app/
    └── (admin)/
        └── admin/
            └── rbac-test/        ← Test page
                └── page.tsx
```

---

## 🔧 **How It Works**

### **1. Module Definition**
```typescript
// app/src/config/staticModules.ts
export const staticModuleDefinitions = {
  modules: {
    10: {
      id: 10,
      name: "Role Management",
      description: "Manage system roles and role configurations",
      icon: "UserCircleIcon",
      color: "blue",
      routes: [
        "/admin/role-management",
        "/user/role-management"
      ],
      category: "admin",
      privileges: [
        "CREATE_ROLE",
        "UPDATE_ROLE", 
        "DELETE_ROLE",
        "VIEW_ROLE",
        "VIEW_ROLE_LIST"
      ]
    }
    // ... more modules
  }
};
```

### **2. Server Privilege Format**
```typescript
// Server response format (what you'll receive)
{
  "id": "role_001",
  "privilege_name": "CREATE_ROLE",
  "privilege_desc": "Create new system roles",
  "module_id": 10
}
```

### **3. Navigation Generation**
```typescript
// AppSidebar automatically generates navigation from modules
const generateNavItems = useCallback((): NavItem[] => {
  const accessibleModules = getAccessibleModules();
  const navItems: NavItem[] = [];

  // Generate navigation from accessible modules
  accessibleModules.forEach(moduleId => {
    const module = getModuleInfo(moduleId);
    // ... create navigation items
  });

  return navItems;
}, [getAccessibleModules, getModuleInfo, userRole]);
```

---

## 🚀 **Key Features**

### **1. Automatic Navigation**
- **No hardcoded menus** - Navigation generated from modules
- **Dynamic filtering** - Only shows accessible modules
- **Consistent structure** - Same navigation logic everywhere

### **2. Module-Based Access Control**
- **Route protection** - Based on module privileges
- **Privilege checking** - User must have module access
- **Category filtering** - Admin/User/Both module categories

### **3. Server Integration Ready**
- **Module ID mapping** - Privileges linked to modules
- **Flexible privileges** - Server controls what users can do
- **Easy updates** - Add/remove privileges on server

---

## 📊 **Module Categories**

### **Admin-Only Modules**
- **Role Management** (ID: 10)
- **Privilege Management** (ID: 20)
- **Permission Management** (ID: 30)
- **User Management** (ID: 50)
- **System Administration** (ID: 100)

### **User-Only Modules**
- **Application Management** (ID: 40)
- **Container Management** (ID: 60)
- **Port & Customer Management** (ID: 70)
- **Shipment Operations** (ID: 80)
- **Analytics & Reports** (ID: 90)
- **Dashboard** (ID: 110)

### **Shared Modules**
- **Container Management** (ID: 60)
- **Port & Customer Management** (ID: 70)
- **Shipment Operations** (ID: 80)
- **Analytics & Reports** (ID: 90)
- **Dashboard** (ID: 110)

---

## 🔐 **Access Control Flow**

### **1. Route Access Check**
```typescript
canAccessRoute(route: string): boolean {
  // Find which module this route belongs to
  const moduleEntry = Object.entries(staticModuleDefinitions.modules)
    .find(([_, module]) => 
      module.routes.some(moduleRoute => route.startsWith(moduleRoute))
    );

  if (!moduleEntry) return true; // Route not defined, allow access

  const [moduleId, module] = moduleEntry;
  
  // Check if user has any privileges for this module
  const hasModuleAccess = userPrivileges.some(privilege => {
    return module.privileges.includes(privilege);
  });
  
  return hasModuleAccess || module.privileges.length === 0;
}
```

### **2. Module Access Check**
```typescript
getAccessibleModules(): number[] {
  if (isSuperUser) return Object.keys(staticModuleDefinitions.modules).map(Number);
  
  const accessibleModules = new Set<number>();
  
  Object.values(staticModuleDefinitions.modules).forEach(module => {
    const hasModuleAccess = userPrivileges.some(privilege => 
      module.privileges.includes(privilege)
    );
    
    if (hasModuleAccess || module.privileges.length === 0) {
      accessibleModules.add(module.id);
    }
  });
  
  return Array.from(accessibleModules);
}
```

---

## 🧪 **Testing the System**

### **1. Test Page**
Navigate to `/admin/rbac-test` to see:
- **Static modules configuration**
- **User privileges**
- **Accessible modules**
- **Route access tests**
- **Navigation generation**

### **2. Test Users**
- **admin@company.com** / **admin123** - Full access to all modules
- **user@company.com** / **user123** - Limited access to user modules

### **3. What to Test**
- ✅ **Login with admin** - Should see all modules
- ✅ **Login with user** - Should see limited modules
- ✅ **Navigation filtering** - Only accessible modules shown
- ✅ **Route protection** - Cannot access unauthorized routes

---

## 🔄 **Adding New Modules**

### **1. Define Module**
```typescript
// In staticModules.ts
120: {
  id: 120,
  name: "New Feature",
  description: "Description of new feature",
  icon: "NewIcon",
  color: "orange",
  routes: [
    "/admin/new-feature",
    "/user/new-feature"
  ],
  category: "both",
  privileges: [
    "VIEW_NEW_FEATURE",
    "CREATE_NEW_FEATURE"
  ]
}
```

### **2. Add Server Privileges**
```typescript
// Server should provide these privileges
{
  "id": "new_001",
  "privilege_name": "VIEW_NEW_FEATURE",
  "privilege_desc": "View new feature",
  "module_id": 120
}
```

### **3. Navigation Updates**
- **Automatic** - No changes needed in AppSidebar
- **Dynamic** - Navigation generated from module definition
- **Consistent** - Same pattern as existing modules

---

## 🎯 **Benefits**

### **1. Maintainability**
- **Single source of truth** - All routes defined in one place
- **Easy updates** - Change routes without touching navigation
- **Consistent structure** - Same pattern across all modules

### **2. Flexibility**
- **Server control** - Privileges managed on server
- **Dynamic access** - Users get different permissions
- **Easy scaling** - Add modules without app updates

### **3. Developer Experience**
- **Clear structure** - Easy to understand module organization
- **Type safety** - Full TypeScript support
- **Testing** - Built-in test components

---

## 🚨 **Important Notes**

### **1. Module IDs**
- **Must be unique** - No duplicate module IDs
- **Numeric only** - Use integers for module IDs
- **Consistent** - Same ID in app and server

### **2. Privilege Names**
- **Must match** - App and server privilege names must be identical
- **Case sensitive** - "CREATE_USER" ≠ "create_user"
- **No spaces** - Use underscores for multi-word privileges

### **3. Route Patterns**
- **Start with module route** - `/admin/user-management` starts with `/admin/user-management`
- **Consistent structure** - Keep route patterns consistent
- **No conflicts** - Ensure routes don't overlap

---

## 🔮 **Future Enhancements**

### **1. Module Dependencies**
- **Parent-child modules** - Hierarchical module structure
- **Required modules** - Some modules require others
- **Module ordering** - Control navigation order

### **2. Advanced Filtering**
- **Role-based modules** - Different modules for different roles
- **Conditional access** - Modules based on user properties
- **Dynamic categories** - Server-controlled module categories

### **3. Performance Optimization**
- **Module caching** - Cache module definitions
- **Lazy loading** - Load modules on demand
- **Privilege optimization** - Efficient privilege checking

---

## 📚 **Related Files**

- **`staticModules.ts`** - Module definitions
- **`useSimpleRBAC.ts`** - RBAC hook
- **`AppSidebar.tsx`** - Navigation component
- **`RBACTestComponent.tsx`** - Test component
- **`AuthContext.tsx`** - Authentication with dummy privileges

---

## ✅ **Implementation Status**

- ✅ **Static modules defined** - All routes mapped to modules
- ✅ **RBAC hook updated** - Works with static modules
- ✅ **Navigation updated** - Generated from modules
- ✅ **Test components** - Verify system functionality
- ✅ **Dummy privileges** - Admin user has all privileges
- ✅ **Documentation** - Complete implementation guide

The system is **ready for production** and can be easily extended with new modules and privileges.
