export interface StaticModule {
  id: number;
  name: string;
  description: string;
  routes: string[]; // Unified array of all routes (admin + user)
  privileges: string[]; // Unified array of all privileges for this module
}

export interface StaticModuleDefinitions {
  modules: Record<number, StaticModule>;
}

export const staticModuleDefinitions: StaticModuleDefinitions = {
  modules: {
    // Core System Modules
    10: {
      id: 10,
      name: "Role Management",
      description: "Manage system roles and role configurations",
      routes: [
        "/admin/role-management",
        "/admin/role-management/create",
        "/admin/role-management/edit",
        "/admin/role-management/view",
        "/admin/role-permission-management",
        "/admin/role-permission-management/assign",
        "/admin/role-permission-management/remove"
      ],
      privileges: [
        "CREATE_ROLE",
        "UPDATE_ROLE", 
        "DELETE_ROLE",
        "VIEW_ROLE",
        "VIEW_ROLE_LIST",
        "CREATE_ROLE_PERMISSION",
        "VIEW_ROLE_PERMISSION_LIST"
      ]
    },
    
    20: {
      id: 20,
      name: "Privilege Management",
      description: "Manage system privileges and permissions",
      routes: [
        "/admin/privilege-management",
        "/admin/privilege-management/view",
        "/admin/privilege-management/assign",
        "/admin/privilege-management/revoke"
      ],
      privileges: [
        "VIEW_PRIVILEGE_LIST"
      ]
    },
    
    30: {
      id: 30,
      name: "Role Permission Management",
      description: "Manage role-permission assignments and configurations",
      routes: [
        "/admin/role-permission-management",
        "/admin/role-permission-management/assign",
        "/admin/role-permission-management/remove",
        "/admin/role-permission-management/view"
      ],
      privileges: [
        "CREATE_ROLE_PERMISSION",
        "VIEW_ROLE_PERMISSION_LIST"
      ]
    },
    
    40: {
      id: 40,
      name: "User Management",
      description: "Manage users, user profiles, and user operations",
      routes: [
        "/admin/user-management",
        "/admin/user-management/create",
        "/admin/user-management/edit",
        "/admin/user-management/view",
        "/admin/user-management/delete",
        "/admin/profile",
        "/user/profile",
        "/user/profile/edit"
      ],
      privileges: [
        "CREATE_USER",
        "UPDATE_USER",
        "DELETE_USER",
        "VIEW_USER",
        "VIEW_USER_LIST",
        "VIEW_USER_SHORT_INFO_LIST",
        "UPDATE_USER_PASSWORD",
        "UPDATE_USER_STATUS"
      ]
    },
    
    50: {
      id: 50,
      name: "Container Management",
      description: "Manage container types, thresholds, and planning",
      routes: [
        "/admin/container-types",
        "/admin/container-thresholds",
        "/admin/container-priority",
        "/admin/container-planning",
        "/user/container-types",
        "/user/container-thresholds",
        "/user/container-priority",
        "/user/container-planning"
      ],
      privileges: [
        "VIEW_CONTAINER_TYPES",
        "CREATE_CONTAINER_TYPE",
        "UPDATE_CONTAINER_TYPE",
        "DELETE_CONTAINER_TYPE",
        "VIEW_CONTAINER_THRESHOLDS",
        "CREATE_THRESHOLD",
        "UPDATE_THRESHOLD",
        "DELETE_THRESHOLD",
        "VIEW_CONTAINER_PRIORITY",
        "CREATE_PRIORITY",
        "UPDATE_PRIORITY",
        "DELETE_PRIORITY",
        "VIEW_CONTAINER_PLANNING",
        "CREATE_PLAN",
        "UPDATE_PLAN",
        "DELETE_PLAN"
      ]
    },
    
    60: {
      id: 60,
      name: "Port & Customer Management",
      description: "Manage ports, customers, and port-customer relationships",
      routes: [
        "/admin/port-customer-master",
        "/admin/port-customer-master/customers",
        "/admin/port-customer-master/pol-ports",
        "/admin/port-customer-master/pod-ports",
        "/user/port-customer-master",
        "/user/port-customer-master/customers",
        "/user/port-customer-master/pol-ports",
        "/user/port-customer-master/pod-ports"
      ],
      privileges: [
        "VIEW_PORT_CUSTOMER_MASTER",
        "VIEW_POL_PORTS",
        "VIEW_POD_PORTS",
        "VIEW_CUSTOMERS",
        "CREATE_PORT",
        "UPDATE_PORT",
        "DELETE_PORT",
        "CREATE_CUSTOMER",
        "UPDATE_CUSTOMER",
        "DELETE_CUSTOMER",
        "EXPORT_CUSTOMERS",
        "EXPORT_POL_PORTS",
        "EXPORT_POD_PORTS"
      ]
    },
    
    70: {
      id: 70,
      name: "Shipment Operations",
      description: "Manage shipment uploads, processing, and operations",
      routes: [
        "/admin/shipment-upload",
        "/admin/shipment-operations/input-file",
        "/admin/shipment-operations/output-file",
        "/admin/shipment-operations/shipment-history",
        "/admin/shipment-operations/uploads-history",
        "/user/shipment-upload",
        "/user/shipment-operations/input-file",
        "/user/shipment-operations/output-file",
        "/user/shipment-operations/shipment-history",
        "/user/shipment-operations/uploads-history"
      ],
      privileges: [
        "VIEW_SHIPMENT_UPLOAD",
        "CREATE_SHIPMENT",
        "UPDATE_SHIPMENT",
        "DELETE_SHIPMENT",
        "VIEW_SHIPMENT_HISTORY",
        "VIEW_UPLOADS_HISTORY",
        "VIEW_INPUT_FILE",
        "VIEW_OUTPUT_FILE",
        "UPLOAD_SHIPMENT_FILE",
        "PROCESS_SHIPMENT",
        "EXPORT_SHIPMENT_DATA"
      ]
    },
    
    80: {
      id: 80,
      name: "Analytics & Reports",
      description: "View analytics, validation results, and generate reports",
      routes: [
        "/admin/assignment-results",
        "/admin/validation-summary",
        "/admin/repositioning-summary",
        "/admin/test-validation",
        "/user/assignment-results",
        "/user/validation-summary",
        "/user/test-validation"
      ],
      privileges: [
        "VIEW_ASSIGNMENT_RESULTS",
        "VIEW_VALIDATION_SUMMARY",
        "VIEW_REPOSITIONING_SUMMARY",
        "VIEW_TEST_VALIDATION",
        "EXPORT_ASSIGNMENT_DATA",
        "EXPORT_VALIDATION_DATA",
        "EXPORT_REPOSITIONING_DATA",
        "RUN_TEST_VALIDATION"
      ]
    },
    
    90: {
      id: 90,
      name: "System Administration",
      description: "System settings, data backup, and administrative tasks",
      routes: [
        "/admin/system-settings",
        "/admin/data-backup",
        "/admin/module-management"
      ],
      privileges: [
        "VIEW_SYSTEM_SETTINGS",
        "UPDATE_SYSTEM_SETTINGS",
        "DELETE_SYSTEM_SETTINGS",
        "VIEW_DATA_BACKUP",
        "CREATE_DATA_BACKUP",
        "RESTORE_DATA_BACKUP",
        "DELETE_DATA_BACKUP"
      ]
    },
    
    100: {
      id: 100,
      name: "Dashboard",
      description: "Main dashboard and overview",
      routes: [
        "/admin/dashboard",
        "/user/dashboard",
        "/dashboard"
      ],
      privileges: [
        "VIEW_DASHBOARD",
        "VIEW_USER_DASHBOARD",
        "VIEW_ADMIN_DASHBOARD"
      ]
    }
  }
};

export default staticModuleDefinitions;
