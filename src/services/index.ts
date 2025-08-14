// Export all services
export { userService, default as UserService } from './userService';
export { roleService, default as RoleService } from './roleService';
export { BaseService } from './baseService';

// Export types
export type { 
  CreateUserRequest,
  UserResponse,
  UserDetailResponse,
  UserShortInfo,
  UserListResponse,
  UserListParams,
  SuperuserModifyRequest,
  SuperuserModifyResponse,
  CreateRoleRequest,
  RoleResponse,
  RoleListResponse,
  RoleListParams,
  Privilege,
  PrivilegeListResponse,
  RoleUserResponse,
  ApiResponse,
  PaginatedResponse
} from '@/types/api';
