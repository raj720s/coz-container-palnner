export interface StaticModule {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  routes: string[]; // Unified array of all routes (admin + user)
  privileges: string[]; // Unified array of all privileges for this module
  subModules?: {
    id: number;
    name: string;
    description: string;
    routes: string[]; // Unified array of all routes
    privileges: string[]; // Unified array of all privileges
  }[];
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
      icon: "UserCircleIcon",
      color: "blue",
      routes: [
        "/admin/role-management",
        "/admin/role-permission-management"
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
      name: "User Management",
      description: "Manage users, user profiles, and user operations",
      icon: "UserCircleIcon",
      color: "indigo",
      routes: [
        "/admin/user-management",
        "/admin/profile",
        "/user/profile"
      ],
      privileges: [
        "CREATE_USER",
        "VIEW_USER_LIST",
        "UPDATE_USER",
        "UPDATE_USER_PROFILE",
        "UPDATE_USER_PASSWORD",
        "UPDATE_USER_STATUS",
        "DELETE_USER",
        "GET_USER_PROFILE",
        "CREATE_USER_ROLE",
        "VIEW_USER_ACTIVITY_LOGS"
      ]
    },
    
    30: {
      id: 30,
      name: "Container Management",
      description: "Manage container types, thresholds, and planning",
      icon: "CubeIcon",
      color: "yellow",
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
    
    40: {
      id: 40,
      name: "Port & Customer Management",
      description: "Manage ports, customers, and port-customer relationships",
      icon: "GlobeIcon",
      color: "teal",
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
      ],
      subModules: [
        {
          id: 41,
          name: "POL Master",
          description: "Manage Port of Loading (POL) ports",
          routes: [
            "/admin/port-customer-master/pol-ports",
            "/user/port-customer-master/pol-ports"
          ],
          privileges: [
            "VIEW_POL_PORTS",
            "CREATE_POL",
            "UPDATE_POL",
            "DELETE_POL",
            "EXPORT_POL_PORTS"
          ]
        },
        {
          id: 42,
          name: "POD Master",
          description: "Manage Port of Destination (POD) ports",
          routes: [
            "/admin/port-customer-master/pod-ports",
            "/user/port-customer-master/pod-ports"
          ],
          privileges: [
            "VIEW_POD_PORTS",
            "CREATE_POD",
            "UPDATE_POD",
            "DELETE_POD",
            "EXPORT_POD_PORTS"
          ]
        },
        {
          id: 43,
          name: "Customer Records",
          description: "Manage customer information and configurations",
          routes: [
            "/admin/port-customer-master/customers",
            "/user/port-customer-master/customers"
          ],
          privileges: [
            "VIEW_CUSTOMERS",
            "CREATE_CUSTOMER",
            "UPDATE_CUSTOMER",
            "DELETE_CUSTOMER",
            "EXPORT_CUSTOMERS"
          ]
        }
      ]
    },
    
    50: {
      id: 50,
      name: "Shipment Operations",
      description: "Manage shipment uploads, processing, and operations",
      icon: "DocumentIcon",
      color: "red",
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
      ],
      subModules: [
        {
          id: 51,
          name: "Upload Shipments",
          description: "Upload and process shipment files",
          routes: [
            "/admin/shipment-upload",
            "/user/shipment-upload"
          ],
          privileges: [
            "VIEW_SHIPMENT_UPLOAD",
            "UPLOAD_SHIPMENT_FILE",
            "PROCESS_SHIPMENT"
          ]
        },
        {
          id: 52,
          name: "Shipment History",
          description: "View shipment history and operations",
          routes: [
            "/admin/shipment-operations/shipment-history",
            "/user/shipment-operations/shipment-history"
          ],
          privileges: [
            "VIEW_SHIPMENT_HISTORY"
          ]
        },
        {
          id: 53,
          name: "File Management",
          description: "Manage input and output files",
          routes: [
            "/admin/shipment-operations/input-file",
            "/admin/shipment-operations/output-file",
            "/user/shipment-operations/input-file",
            "/user/shipment-operations/output-file"
          ],
          privileges: [
            "VIEW_INPUT_FILE",
            "VIEW_OUTPUT_FILE"
          ]
        },
        {
          id: 54,
          name: "Uploads History",
          description: "View upload history and status",
          routes: [
            "/admin/shipment-operations/uploads-history",
            "/user/shipment-operations/uploads-history"
          ],
          privileges: [
            "VIEW_UPLOADS_HISTORY"
          ]
        }
      ]
    },
    
    60: {
      id: 60,
      name: "Analytics & Reports",
      description: "View analytics, validation results, and generate reports",
      icon: "ChartIcon",
      color: "pink",
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
    
    70: {
      id: 70,
      name: "System Administration",
      description: "System settings, data backup, and administrative tasks",
      icon: "CogIcon",
      color: "gray",
      routes: [
        "/admin/system-settings",
        "/admin/data-backup"
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
    
    80: {
      id: 80,
      name: "Dashboard",
      description: "Main dashboard and overview",
      icon: "HomeIcon",
      color: "blue",
      routes: [
        "/admin/dashboard",
        "/user/dashboard"
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
