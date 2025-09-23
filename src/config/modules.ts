export interface ModuleDefinition {
  name: string;
  description: string;
  icon: string;
  color: string;
  routes: string[];
  privileges: string[];
}

export interface RolePermissions {
  description: string;
  modules: string[];
  privileges: string[] | "*";
}

export interface ModuleDefinitions {
  modules: Record<string, ModuleDefinition>;
  rolePermissions: Record<string, RolePermissions>;
}

export const moduleDefinitions: ModuleDefinitions = {
  "modules": {
    "10": {
      "name": "Role Management",
      "description": "Manage system roles and role configurations",
      "icon": "UserCircleIcon",
      "color": "blue",
      "routes": [
        "/role-management"
      ],
      "privileges": [
        "CREATE_ROLE",
        "VIEW_ROLE",
        "VIEW_ROLE_LIST",
        "UPDATE_ROLE",
        "DELETE_ROLE"
      ]
    },
    "20": {
      "name": "Privilege Management",
      "description": "Manage system privileges and permissions",
      "icon": "CheckCircleIcon",
      "color": "green",
      "routes": [
        "/admin/privilege-management"
      ],
      "privileges": [
        "VIEW_PRIVILEGE_LIST"
      ]
    },
    "30": {
      "name": "Permission Management",
      "description": "Manage role-permission assignments",
      "icon": "AlertIcon",
      "color": "purple",
      "routes": [
        "/admin/role-permission-management"
      ],
      "privileges": [
        "CREATE_ROLE_PERMISSION",
        "VIEW_ROLE_PERMISSION_LIST"
      ]
    },
    "60": {
      "name": "User Management",
      "description": "Manage users, user profiles, and user operations",
      "icon": "UserCircleIcon",
      "color": "indigo",
      "routes": [
        "/user-management",
        "/profile"
      ],
      "privileges": [
        "CREATE_USER",
        "VIEW_USER",
        "VIEW_USER_LIST",
        "VIEW_USER_SHORT_INFO_LIST",
        "UPDATE_USER",
        "UPDATE_USER_PASSWORD",
        "UPDATE_USER_STATUS",
        "DELETE_USER"
      ]
    },
    "70": {
      "name": "Container Management",
      "description": "Manage container types, thresholds, and planning",
      "icon": "AlertIcon",
      "color": "yellow",
      "routes": [
        "/container-types",
        "/container-thresholds",
        "/container-priority",
        "/container-planning"
      ],
      "privileges": []
    },
    "80": {
      "name": "Port & Customer Management",
      "description": "Manage ports, customers, and port-customer relationships",
      "icon": "UserCircleIcon",
      "color": "teal",
      "routes": [
        "/port-customer-master",
        "/port-customer-master/customers",
        "/port-customer-master/pol-ports",
        "/port-customer-master/pod-ports"
      ],
      "privileges": []
    },
    "90": {
      "name": "Shipment Operations",
      "description": "Manage shipment uploads, processing, and operations",
      "icon": "AlertIcon",
      "color": "red",
      "routes": [
        "/shipment-upload",
        "/shipment-operations/uploads-history"
      ],
      "privileges": []
    },
    "100": {
      "name": "Analytics & Reports",
      "description": "Assignment results, validation summaries, and repositioning",
      "icon": "CheckCircleIcon",
      "color": "pink",
      "routes": [
        "/assignment-results",
        "/validation-summary"
      ],
      "privileges": []
    },
    "110": {
      "name": "System Administration",
      "description": "System settings, data backup, and administrative tasks",
      "icon": "AlertIcon",
      "color": "gray",
      "routes": [
        "/admin/system-settings",
        "/admin/data-backup"
      ],
      "privileges": []
    },
    "120": {
      "name": "Dashboard",
      "description": "Main dashboard and overview pages",
      "icon": "CheckCircleIcon",
      "color": "blue",
      "routes": [
        "/dashboard"
      ],
      "privileges": []
    }
  },
  "rolePermissions": {
    "admin": {
      "description": "Full system access with all privileges",
      "modules": ["10", "20", "30", "60", "70", "80", "90", "100", "110", "120"],
      "privileges": "*"
    },
    "manager": {
      "description": "Management level access with specific privileges",
      "modules": ["10", "60", "70", "80", "90", "100", "120"],
      "privileges": [
        "VIEW_ROLE_LIST",
        "VIEW_USER_LIST",
        "VIEW_USER",
        "UPDATE_USER_STATUS"
      ]
    },
    "user": {
      "description": "Basic user access to operational features",
      "modules": ["70", "80", "90", "100", "120"],
      "privileges": []
    }
  }
};

export default moduleDefinitions;
