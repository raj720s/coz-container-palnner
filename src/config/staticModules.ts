export interface StaticModule {
  id: number;
  name: string;
  description: string;
  routes: string[];
  privileges: string[];
  icon?: string;
  color?: string;
}

export const staticModules: Record<number, StaticModule> = {
  10: {
    id: 10,
    name: "Role Management",
    description: "Manage system roles and role configurations",
    routes: [
      "/role-management",
      "/admin/role-management",
      "/user/role-management"
    ],
    privileges: [
      "VIEW_ROLES",
      "CREATE_ROLE",
      "UPDATE_ROLE",
      "DELETE_ROLE",
      "MANAGE_ROLE_PERMISSIONS"
    ],
    icon: "shield-check",
    color: "blue"
  },
  20: {
    id: 20,
    name: "Privilege Management",
    description: "Manage system privileges and permissions",
    routes: [
      "/privilege-management",
      "/admin/privilege-management"
    ],
    privileges: [
      "VIEW_PRIVILEGES",
      "CREATE_PRIVILEGE",
      "UPDATE_PRIVILEGE",
      "DELETE_PRIVILEGE"
    ],
    icon: "key",
    color: "purple"
  },
  30: {
    id: 30,
    name: "Role Permission Management",
    description: "Manage role-permission assignments and configurations",
    routes: [
      "/role-permission-management",
      "/admin/role-permission-management"
    ],
    privileges: [
      "VIEW_ROLE_PERMISSIONS",
      "ASSIGN_ROLE_PERMISSIONS",
      "REMOVE_ROLE_PERMISSIONS"
    ],
    icon: "link",
    color: "indigo"
  },
  40: {
    id: 40,
    name: "User Management",
    description: "Manage users, user profiles, and user operations",
    routes: [
      "/user-management",
      "/admin/user-management",
      "/user-management/users",
      "/user-management/customer-mapping"
    ],
    privileges: [
      "VIEW_USERS",
      "CREATE_USER",
      "UPDATE_USER",
      "DELETE_USER",
      "MANAGE_USER_ROLES",
      "MANAGE_USER_CUSTOMERS"
    ],
    icon: "users",
    color: "green"
  },
  50: {
    id: 50,
    name: "Container Management",
    description: "Manage container types, thresholds, and planning",
    routes: [
      "/container-management",
      "/admin/container-management",
      "/container-priority",
      "/container-thresholds",
      "/container-types"
    ],
    privileges: [
      "VIEW_CONTAINERS",
      "MANAGE_CONTAINER_PRIORITIES",
      "MANAGE_CONTAINER_THRESHOLDS",
      "MANAGE_CONTAINER_TYPES"
    ],
    icon: "box",
    color: "orange"
  },
  60: {
    id: 60,
    name: "Port & Customer Management",
    description: "Manage ports, customers, and port-customer relationships",
    routes: [
      "/port-customer-master",
      "/port-customer-master/customers",
      "/port-customer-master/pol-ports",
      "/port-customer-master/pod-ports",
      "/admin/port-customer-master"
    ],
    privileges: [
      "VIEW_CUSTOMERS",
      "VIEW_POL_PORTS",
      "VIEW_POD_PORTS",
      "MANAGE_CUSTOMERS",
      "MANAGE_PORTS"
    ],
    icon: "building-office",
    color: "teal"
  },
  70: {
    id: 70,
    name: "Shipment Operations",
    description: "Manage shipment uploads, processing, and operations",
    routes: [
      "/shipment-operations",
      "/admin/shipment-operations",
      "/shipment-upload",
      "/shipment-processing"
    ],
    privileges: [
      "VIEW_SHIPMENTS",
      "UPLOAD_SHIPMENTS",
      "PROCESS_SHIPMENTS",
      "MANAGE_SHIPMENT_OPERATIONS"
    ],
    icon: "truck",
    color: "red"
  },
  80: {
    id: 80,
    name: "Analytics & Reports",
    description: "View analytics, validation results, and generate reports",
    routes: [
      "/analytics",
      "/reports",
      "/admin/analytics",
      "/admin/reports",
      "/validation-results"
    ],
    privileges: [
      "VIEW_ANALYTICS",
      "VIEW_REPORTS",
      "GENERATE_REPORTS",
      "VIEW_VALIDATION_RESULTS"
    ],
    icon: "chart-bar",
    color: "yellow"
  },
  90: {
    id: 90,
    name: "System Administration",
    description: "System settings, data backup, and administrative tasks",
    routes: [
      "/system-admin",
      "/admin/system-admin",
      "/system-settings",
      "/data-backup"
    ],
    privileges: [
      "VIEW_SYSTEM_SETTINGS",
      "MANAGE_SYSTEM_SETTINGS",
      "MANAGE_DATA_BACKUP",
      "SYSTEM_ADMINISTRATION"
    ],
    icon: "cog",
    color: "gray"
  },
  100: {
    id: 100,
    name: "Dashboard",
    description: "Main dashboard and overview",
    routes: [
      "/dashboard",
      "/user/dashboard",
      "/admin/dashboard"
    ],
    privileges: [
      "VIEW_DASHBOARD",
      "VIEW_USER_DASHBOARD",
      "VIEW_ADMIN_DASHBOARD"
    ],
    icon: "home",
    color: "blue"
  }
};

// Export modules as an array for easier iteration
export const staticModulesArray = Object.values(staticModules);

// Export modules as an object with modules property for backward compatibility
export const staticModuleDefinitions = {
  modules: staticModules
};

export default staticModules;
