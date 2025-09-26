"use client";

import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, SortingState } from "@tanstack/react-table";
import { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";
import { FormModal } from "@/components/ui/modal/FormModal";
import { CommonModalWrapper } from "@/components/ui/modal/CommonModalWrapper";
import { PrivilegeModal } from "@/components/ui/modal/PrivilegeModal";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import { useFormModal } from "@/hooks/useFormModal";
import Input from "@/components/form/input/InputField";
import { DownloadIcon, AlertIcon, CheckCircleIcon, UserCircleIcon, PencilIcon, PlusIcon, TrashBinIcon, EyeIcon, InformationCircleIcon } from "@/icons";
import Pagination from "@/components/tables/Pagination";
import { roleService } from "@/services/roleService";
import { CreateRoleRequest, UpdateRoleRequest } from "@/services/roleService";
import { RoleListResponseV2 } from "@/types/api";
import { RoleForm } from "@/components/forms/RoleForm";
// Removed useRoles - using roleService directly
import { staticModuleDefinitions } from "@/config/staticModules";
import { useCommonData } from "@/hooks/useCommonData";
import { fetchUsersJson, selectUsersJson } from "@/store/slices/commonDataSlice";
import { useSelector } from "react-redux";

const columnHelper = createColumnHelper<RoleListResponseV2>();

// Helper function to get module information
const getModuleInfo = (moduleId: string) => {
  const module = staticModuleDefinitions.modules[parseInt(moduleId)];
  return module || {
    name: `Module ${moduleId}`,
    description: "Unknown module",
    icon: "AlertIcon",
    color: "gray"
  };
};

function AdminRoleManagementClient() {
  // State management for roles
  const [roles, setRoles] = useState<RoleListResponseV2[]>([]);
  const [rolesWithPrivileges, setRolesWithPrivileges] = useState<RoleListResponseV2[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [privileges, setPrivileges] = useState<{ count: number; results: any[] } | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Get users JSON data using useCommonData hook
  const { data: usersJson, loading: usersLoading, error: usersError, refresh: refreshUsers } = useCommonData(fetchUsersJson, selectUsersJson);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Helper function to get user name by ID
  const getUserName = useCallback((userId: number | null): string => {
    if (!userId || !usersJson) return '-';
    const userName = usersJson[userId.toString()];
    return userName || `User ${userId}`;
  }, [usersJson]);
  
  // Fetch roles function
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build request parameters
      const requestParams = {
        include_privilege_data: true,
        role_name: globalFilter || undefined,
        order_by: sorting.length > 0 ? sorting[0].id : undefined,
        order_type: sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
      };
      
      const response = await roleService.getRoles(requestParams);
      // Handle paginated response format: { count: number, results: RoleListResponseV2[] }
      if (Array.isArray(response)) {
        setRoles(response);
        setRolesWithPrivileges(response);
        setTotalCount(response.length);
      } else {
        setRoles((response as any).results || []);
        setRolesWithPrivileges((response as any).results || []);
        setTotalCount((response as any).count || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roles');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  }, [globalFilter, sorting, pagination.pageIndex, pagination.pageSize]);

  // Load roles on component mount
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);
  


  const {
    isOpen: isModalOpen,
    isLoading: isModalLoading,
    editingItem,
    openModal,
    closeModal,
    setLoading: setModalLoading,
  } = useFormModal<RoleListResponseV2>();

  // Privileges modal state
  const [isPrivilegesModalOpen, setIsPrivilegesModalOpen] = useState(false);
  const [selectedRolePrivileges, setSelectedRolePrivileges] = useState<string[]>([]);
  const [selectedRoleName, setSelectedRoleName] = useState("");
  const [isLoadingPrivileges, setIsLoadingPrivileges] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleListResponseV2 | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch privileges on component mount
  useEffect(() => {
    fetchPrivileges();
  }, []);

  // Refetch roles when filters change
  useEffect(() => {
    if (!loading) {
      // Filter roles locally since they're already in Redux state
      // The useRoles hook handles fetching from API
    }
  }, [globalFilter, pagination.pageIndex, pagination.pageSize, loading]);

  const fetchPrivileges = async () => {
    try {
      const response = await roleService.getPrivileges();
      console.log('🔍 Privileges API response:', response);
      
      console.log('📊 Response structure:', {
        count: response.count,
        resultsType: typeof response.results,
        resultsIsArray: Array.isArray(response.results),
        resultsLength: response.results?.length,
        firstItem: response.results?.[0],
        sampleResults: response.results?.slice(0, 3)
      });
      setPrivileges(response);
    } catch (error) {
      console.error('Error fetching privileges:', error);
      toast.error('Failed to fetch privileges');
    }
  };

  const handleCreateRole = async (roleData: CreateRoleRequest) => {
    try {
      setModalLoading(true);
      
      const response = await roleService.createRole(roleData);
      
      toast.success('Role created successfully');
      
      // Refresh the role list
      fetchRoles();
      
      // Close the modal
      closeModal();
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('Failed to create role');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditRole = async (roleData: UpdateRoleRequest) => {
    if (!editingItem) return;
    
    try {
      setModalLoading(true);
      
      const response = await roleService.updateRole(editingItem.id, roleData);
      
      toast.success('Role updated successfully');
      
      // Refresh the role list
      fetchRoles();
      
      // Close the modal
      closeModal();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    // Find the role by ID to show in the delete modal
    const role = roles.find(r => r.id.toString() === roleId);
    if (role) {
      openDeleteModal(role);
    }
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      setIsDeleting(true);
      console.log('🚀 Deleting role:', roleToDelete);
      
      const result = await roleService.deleteRole(roleToDelete.id);
      console.log('✅ Delete result:', result);
      
      if (result.success) {
        toast.success(result.message || `Role "${roleToDelete.role_name}" deleted successfully`);
        setDeleteError(null); // Clear any errors on success
        closeDeleteModal();
        // Refresh the roles list
        await fetchRoles();
      } else {
        // Handle service response error - result only has success boolean
        const errorMessage = result.message || 'Failed to delete role';
        setDeleteError(errorMessage);
        toast.error(errorMessage);
        console.error('❌ Service error response:', result);
      }
    } catch (error: any) {
      console.error('❌ Error deleting role:', error);
      
      // Extract error message from different error types
      let errorMessage = 'Failed to delete role';
      
      if (error.response?.data?.message) {
        // API error response
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        // API error response with error field
        errorMessage = error.response.data.error;
      } else if (error.message) {
        // JavaScript error
        errorMessage = error.message;
      } else if (error.statusText) {
        // HTTP status text
        errorMessage = error.statusText;
      }
      
      setDeleteError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };



  const handleSubmit = async (roleData: CreateRoleRequest | UpdateRoleRequest) => {
    if (editingItem) {
      await handleEditRole(roleData as UpdateRoleRequest);
    } else {
      await handleCreateRole(roleData as CreateRoleRequest);
    }
  };

  const openPrivilegesModal = async (role: RoleListResponseV2) => {
    console.log('🔍 Opening privileges modal for role:', role);
    console.log('📊 Role ID:', role.id);
    console.log('📊 Role privilege_names:', role.privilege_names);
    
    setIsLoadingPrivileges(true);
    
    try {
      // Use privilege_names directly from the role object since they're already available
      if (role.privilege_names && role.privilege_names.length > 0) {
        console.log('📊 Using privilege_names from role object:', role.privilege_names);
        
        setSelectedRolePrivileges(role.privilege_names || []);
        setSelectedRoleName(role.role_name);
        setIsPrivilegesModalOpen(true);
      } else {
        console.log('⚠️ No privilege_names in role object, falling back to API call');
        
        // Fallback to API call if no privilege_names available
       const rolePrivileges = await roleService.getRolePrivileges(role.id);
        console.log('📊 Role privileges API response:', rolePrivileges);
      
      const privilegeNames = rolePrivileges.flatMap(module => 
        module.privileges?.map(p => p.name) || []
      );
        console.log('📊 Extracted privilege names from API:', privilegeNames);
      
      setSelectedRolePrivileges(privilegeNames);
      setSelectedRoleName(role.role_name);
      setIsPrivilegesModalOpen(true);
      }
    } catch (error) {
      console.error('❌ Error fetching role privileges:', error);
      toast.error('Failed to fetch role privileges');
      // Fallback to empty privileges
      setSelectedRolePrivileges([]);
      setSelectedRoleName(role.role_name);
      setIsPrivilegesModalOpen(true);
    } finally {
      setIsLoadingPrivileges(false);
    }

  };

  const closePrivilegesModal = () => {
    setIsPrivilegesModalOpen(false);
    setSelectedRolePrivileges([]);
    setSelectedRoleName("");
  };

  // Delete role functions
  const openDeleteModal = (role: RoleListResponseV2) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
    setDeleteError(null); // Clear any previous errors
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setRoleToDelete(null);
    setDeleteError(null); // Clear errors when closing
  };

  // Server-side filtering is now handled in fetchRoles

  // Define columns
  const columns = useMemo(() => [
    columnHelper.accessor("role_name", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Role Name
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("role_description", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Role Description
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("id", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Role Privileges
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <button
          onClick={() => openPrivilegesModal(info.row.original)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">View</span>
            <span>privileges</span>
            <InformationCircleIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
          </div>
        </button>
      ),
    }),
    columnHelper.display({
      id: "created_by",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Created By
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
              cell: (info) => (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {usersLoading ? (
              <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
            ) : (
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-blue-600 font-semibold text-xs">
                    {info.row.original.created_by}
                  </span>
                </div>
                <span>{getUserName(info.row.original.created_by)}</span>
              </div>
            )}
          </div>
        ),
    }),
    columnHelper.accessor("created_on", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Created On
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(info.getValue() as string).toLocaleDateString()}
        </div>
      ),
    }),
    columnHelper.display({
      id: "modified_by",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Modified By
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
              cell: (info) => (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {usersLoading ? (
              <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
            ) : info.row.original.modified_by ? (
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-green-600 font-semibold text-xs">
                    {info.row.original.modified_by}
                  </span>
                </div>
                <span>{getUserName(info.row.original.modified_by)}</span>
              </div>
            ) : (
              <span className="text-gray-400 italic">Not modified</span>
            )}
          </div>
        ),
    }),
    columnHelper.accessor("modified_on", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Modified On
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {info.getValue() ? new Date(info.getValue() as string).toLocaleDateString() : '-'}
        </div>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openModal(info.row.original)}
            className="p-1"
          >
            <PencilIcon className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteRole(info.row.original.id.toString())}
            className="p-1 text-red-600 hover:text-red-700"
          >
            <TrashBinIcon className="w-4 h-4" />
          </Button>
        </div>
      ),
    }),
  ], [openModal, handleDeleteRole, openPrivilegesModal]);

  const table = useReactTable({
    data: roles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: {
      globalFilter,
      pagination,
      sorting,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const total = totalCount;
    const active = totalCount; // All roles are considered active
    
    // Calculate total privileges - handle different response structures
    let totalPrivileges = 0;
    if (privileges && privileges.results) {
      if (typeof privileges.results === 'object' && !Array.isArray(privileges.results)) {
        // If results is an object with module keys
        if (Array.isArray(Object.values(privileges.results)[0])) {
          totalPrivileges = Object.values(privileges.results).flat().length;
        }
      } else if (Array.isArray(privileges.results)) {
        // If results is a direct array
        totalPrivileges = privileges.results.length;
      }
    }

    return { total, active, totalPrivileges };
  }, [totalCount, privileges]);

  const handleAddNew = () => {
    openModal();
  };

  const handleExport = () => {
    // Implement export functionality
    toast.success('Export functionality coming soon');
  };

  const clearSearch = () => {
    setGlobalFilter("");
    setPagination({ pageIndex: 0, pageSize: 10 });
  };


  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Roles</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchRoles} className="bg-blue-600 hover:bg-blue-700">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Role Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage system roles, permissions, and access control
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Roles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <UserCircleIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Roles</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Privileges</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalPrivileges}</p>
            </div>
            <AlertIcon className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

                    {/* Search and Controls */}
       <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow mb-6">
         <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
           <div className="flex-1 max-w-md">
             <Input
               placeholder="Search by role name..."
               value={globalFilter}
               onChange={(e) => setGlobalFilter(e.target.value)}
               className="w-full"
             />
           </div>
           <div className="flex items-center space-x-2">
             {globalFilter && (
               <Button onClick={clearSearch} size="sm" variant="outline">
                 Clear Search
               </Button>
             )}
             {usersError && (
               <Button onClick={refreshUsers} size="sm" variant="outline" className="text-orange-600 border-orange-300 hover:bg-orange-50">
                 <UserCircleIcon className="w-4 h-4 mr-2" />
                 Refresh Users
               </Button>
             )}
             <Button onClick={handleAddNew} size="sm">
               <PlusIcon className="w-4 h-4 mr-2" />
               Add Role
             </Button>
           </div>
         </div>
       </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading roles...</p>
            </div>
          </div>
        )}
        
        {/* Users Data Loading Indicator */}
        {usersLoading && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <p className="text-sm text-blue-700">Loading user data...</p>
            </div>
          </div>
        )}
        
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {loading ? 'Loading...' : 'No roles found'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden">
          {table.getRowModel().rows.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              {loading ? 'Loading...' : 'No roles found'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {table.getRowModel().rows.map((row) => (
                <div key={row.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="space-y-3">
                    {/* Role Name and Description */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {row.original.role_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {row.original.role_description || 'No description'}
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </span>
                    </div>

                    {/* Privilege Count and Created Date */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Privileges:</span>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {row.original.privilege_names?.length || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Created:</span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(row.original.created_on).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Created By and Modified By */}
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Created By:</span>
                        <div className="flex items-center mt-1">
                          {usersLoading ? (
                            <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
                          ) : (
                            <>
                              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                                <span className="text-blue-600 font-semibold text-xs">
                                  {row.original.created_by}
                                </span>
                              </div>
                              <span className="text-sm text-gray-900 dark:text-white">
                                {getUserName(row.original.created_by)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {row.original.modified_by && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Modified By:</span>
                          <div className="flex items-center mt-1">
                            {usersLoading ? (
                              <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
                            ) : (
                              <>
                                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-green-600 font-semibold text-xs">
                                    {row.original.modified_by}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {getUserName(row.original.modified_by)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModal(row.original)}
                          className="flex-1"
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPrivilegesModal(row.original)}
                          className="flex-1"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteRole(row.original.id.toString())}
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <TrashBinIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {roles.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700 dark:text-gray-300 order-2 sm:order-1">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              totalCount
            )}{" "}
            of {totalCount} results
          </div>
          <div className="order-1 sm:order-2">
            <Pagination
              currentPage={table.getState().pagination.pageIndex + 1}
              totalPages={table.getPageCount()}
              onPageChange={(page) => table.setPageIndex(page - 1)}
            />
          </div>
        </div>
      )}


             {/* Form Modal */}
       <FormModal
         isOpen={isModalOpen}
         onClose={closeModal}
         title={editingItem ? "Edit Role" : "Add New Role"}
         size="lg"
         showHeader={true}
         showFooter={true}
       >
         <RoleForm
            initialData={editingItem ? {
              id: editingItem.id,
              role_name: editingItem.role_name,
              role_description: editingItem.role_description,
              privilege_names: editingItem.privilege_names || []
            } : undefined}
           privileges={privileges}
           rolesWithPrivileges={rolesWithPrivileges}
           onSubmit={handleSubmit}
           onCancel={closeModal}
           isLoading={isModalLoading}
         />
       </FormModal>

               {/* Privileges Modal */}
        <PrivilegeModal
          isOpen={isPrivilegesModalOpen}
          onClose={closePrivilegesModal}
          title={`Privileges for ${selectedRoleName}`}
          privileges={selectedRolePrivileges}
          isLoading={isLoadingPrivileges}
          emptyMessage="No privileges assigned to this role."
          emptyDescription="You can assign privileges when editing the role."
          showFooter={true}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={confirmDeleteRole}
          title="Delete Role"
          message="Are you sure you want to delete this role? This action cannot be undone and will remove all associated privileges and user assignments."
          itemName={roleToDelete?.role_name}
          isLoading={isDeleting}
          variant="danger"
          error={deleteError}
        />
      </div>
    );
  }

  export default withSimplifiedRBAC(AdminRoleManagementClient,{
    privilege: "VIEW_ROLE_MANAGEMENT", // Minimum required privilege to access
    role: ["1"], // Only admin users (role 1) can access
    allowSuperUserBypass: true, // Superusers can always access
    redirectTo: "/dashboard" // Redirect if no access  
  })
