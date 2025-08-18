// User Management Types
export interface CreateUserRequest {
  status: boolean;
  first_name: string;
  last_name: string;
  email: string;
  organisation_name: string;
  role: number;
}

export interface UserResponse {
  status: boolean;
  first_name: string;
  last_name: string;
  email: string;
  organisation_name: string;
  created_on: string;
  role_id: number;
  phone_number: string;
  is_active?: boolean;
  updated_on?: string;
  role_details?: RoleInfo;
}

export interface RoleInfo {
  id: number;
  name: string;
  description?: string;
}

export interface UserDetailResponse extends UserResponse {
  id: number;
  updated_on?: string;
  is_active?: boolean;
  role_details?: RoleInfo;
}

// New type for actual API response structure
export interface UserProfileResponse {
  id: number;
  is_superuser: boolean;
  announcement_read_flag: number;
  role: Array<{
    id: number;
    role_name: string;
  }>;
  email: string;
  first_name: string;
  last_name: string;
  created_on: string;
  last_login: string;
  status: boolean;
  country_code: string | null;
  is_deleted: boolean;
  phone_number: string | null;
  modified_on: string | null;
  organisation_name: string;
  timezone: string | null;
  country: string | null;
  created_by: number;
  modified_by: number | null;
}

export interface UserShortInfo {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  organisation_name: string;
}

export interface UserListResponse {
  status: boolean;
  data: UserDetailResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: number;
  organisation?: string;
  status?: boolean;
}

// Role Management Types
export interface CreateRoleRequest {
  name: string;
  description?: string;
  privileges: number[];
  is_active?: boolean;
}

export interface RoleResponse {
  id: number;
  name: string;
  description?: string;
  privileges: number[];
  is_active: boolean;
  created_on: string;
  updated_on?: string;
}

export interface RoleListResponse {
  status: boolean;
  data: RoleResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface RoleListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
}

export interface Privilege {
  id: number;
  name: string;
  description?: string;
  module: string;
  action: string;
}

export interface PrivilegeListResponse {
  status: boolean;
  data: Privilege[];
  total: number;
}

export interface RoleUserResponse {
  status: boolean;
  data: {
    role: RoleResponse;
    users: UserShortInfo[];
    total_users: number;
  };
}

// Superuser Management Types
export interface SuperuserModifyRequest {
  is_superuser: boolean;
  reason?: string;
}

export interface SuperuserModifyResponse {
  status: boolean;
  message: string;
  user_id: number;
  is_superuser: boolean;
  modified_on: string;
}

// Common API Response Types
export interface ApiResponse<T = any> {
  status: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  status: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
