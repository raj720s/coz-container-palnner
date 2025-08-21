// Export all services
export { default as roleService, type RoleResponse, type RoleListResponse, type RoleListRequest, type RoleListResponseV2 } from './roleService';
export { default as userService } from './userService';
export { default as polService, type POLResponse, type POLListResponse, type POLListRequest, type CreatePOLRequest, type UpdatePOLRequest } from './polService';
export { default as baseService } from './baseService';

// Export base service class for inheritance
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
