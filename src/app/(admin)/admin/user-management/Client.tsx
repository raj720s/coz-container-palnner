"use client";

import { withSimpleRBAC } from "@/components/auth/withSimpleRBAC";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, getSortedRowModel, getFilteredRowModel, getPaginationRowModel } from "@tanstack/react-table";
import { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";

import { UserForm, type UserFormData } from "@/components/forms/UserForm";
import { FormModal } from "@/components/ui/modal/FormModal";
import { CommonModalWrapper } from "@/components/ui/modal/CommonModalWrapper";
import { PrivilegeModal } from "@/components/ui/modal/PrivilegeModal";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import Input from "@/components/form/input/InputField";
import { DownloadIcon, AlertIcon, CheckCircleIcon, TimeIcon, UserCircleIcon, PencilIcon, PlusIcon, TrashBinIcon, InformationCircleIcon } from "@/icons";
import { User, AVAILABLE_ROUTES } from "@/types/user";

import Pagination from "@/components/tables/Pagination";
import { userService } from "@/services/userService";
import { UserListResponseV2 } from "@/types/api";
import { roleService } from "@/services/roleService";

import { useRoles } from "@/hooks/useRoles";
import moduleDefinitions from "@/config/modules.json";

const columnHelper = createColumnHelper<User>();

function AdminUserManagementClient() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });



  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<User | null>(null);

  const openModal = (user?: User) => {
    setEditingItem(user || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Privileges modal state
  const [isPrivilegesModalOpen, setIsPrivilegesModalOpen] = useState(false);
  const [selectedUserPrivileges, setSelectedUserPrivileges] = useState<string[]>([]);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [isLoadingPrivileges, setIsLoadingPrivileges] = useState(false);

  // Access Control Routes modal state
  const [isAccessControlModalOpen, setIsAccessControlModalOpen] = useState(false);
  const [selectedUserAccessControl, setSelectedUserAccessControl] = useState<string[]>([]);
  const [selectedUserForAccessControl, setSelectedUserForAccessControl] = useState<User | null>(null);

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get roles from Redux
  const { roles } = useRoles();



  // Helper function to get module info
  const getModuleInfo = (moduleId: string) => {
    const module = moduleDefinitions.modules[moduleId as keyof typeof moduleDefinitions.modules];
    return module || {
      name: 'Unknown Module',
      description: 'Module information not available',
      color: 'gray'
    };
  };

  // Function to open privileges modal for a user
  const openPrivilegesModal = async (user: User) => {
    setIsLoadingPrivileges(true);
    
    try {
      // Find the role for this user from the roles state
      const userRole = roles.find(role => role.id === user.role.toString());
      
      if (userRole) {
        // First try to use the role data from the useRoles hook
        if (userRole.privilege_names && userRole.privilege_names.length > 0) {
          console.log('📊 Using privilege data from roles state:', userRole.privilege_names);
          setSelectedUserPrivileges(userRole.privilege_names);
        } else {
          console.log('⚠️ No privilege data in roles state, falling back to API call');
          
          // Fallback to API call if no privilege data in roles state
          const rolePrivileges = await roleService.getPrivilegesByRole(parseInt(userRole.id));
          console.log('📊 Role privileges API response:', rolePrivileges);
          
          const privilegeNames = rolePrivileges.results?.map(p => p.privilege_name) || [];
          console.log('📊 Extracted privilege names from API:', privilegeNames);
          
          setSelectedUserPrivileges(privilegeNames);
        }
      } else {
        console.log('⚠️ No role found for user, setting empty privileges');
        setSelectedUserPrivileges([]);
      }
      
      setSelectedUserName(`${user.firstName} ${user.lastName}`);
      setIsPrivilegesModalOpen(true);
    } catch (error) {
      console.error('❌ Error fetching user privileges:', error);
      toast.error('Failed to fetch user privileges');
      // Fallback to empty privileges
      setSelectedUserPrivileges([]);
      setSelectedUserName(`${user.firstName} ${user.lastName}`);
      setIsPrivilegesModalOpen(true);
    } finally {
      setIsLoadingPrivileges(false);
    }
  };

  const closePrivilegesModal = () => {
    setIsPrivilegesModalOpen(false);
    setSelectedUserPrivileges([]);
    setSelectedUserName("");
  };

  // Function to open access control modal for a user
  const openAccessControlModal = (user: User) => {
    setSelectedUserAccessControl(user.accessControl || []);
    setSelectedUserForAccessControl(user);
    setIsAccessControlModalOpen(true);
  };

  const closeAccessControlModal = () => {
    setIsAccessControlModalOpen(false);
    setSelectedUserAccessControl([]);
    setSelectedUserForAccessControl(null);
  };

  // Delete user functions
  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
    setDeleteError(null); // Clear any previous errors
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
    setDeleteError(null); // Clear errors when closing
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      // Call the user service to delete user
      await userService.deleteUser(parseInt(userToDelete.id));
      
      toast.success('User deleted successfully');
      closeDeleteModal();
      
      // Refresh the user list
      await fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setDeleteError(error?.message || 'Failed to delete user');
      toast.error('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setFilterLoading(true);
      
      // Build the request body for the new POST endpoint
      const requestBody = {
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        first_name: globalFilter || undefined,
        last_name: globalFilter || undefined,
        email: globalFilter || undefined,
        organisation_name: globalFilter || undefined,
        role_name: roleFilter === 1 ? 'admin' : roleFilter === 2 ? 'user' : roleFilter === 3 ? 'manager' : undefined,
        status: statusFilter !== null ? (statusFilter ? 1 : 0) : undefined,
        export: false,
      };
      
      const response = await userService.getUsers(requestBody);
      
      // Transform API response to match our User type
      const transformedUsers: User[] = response.results.map((apiUser: any) => ({
        id: apiUser.id.toString(),
        firstName: apiUser.first_name,
        lastName: apiUser.last_name,
        email: apiUser.email,
        role: apiUser.is_superuser ? 1 : 2, // Map superuser to admin (1), others to user (2)
        status: apiUser.status ? "active" : "inactive",
        lastLogin: apiUser.last_login || apiUser.created_on,
        createdAt: apiUser.created_on,
        organisation_name: apiUser.organisation_name || "",
        permissions: apiUser.role_data?.[0]?.role_name ? [apiUser.role_data[0].role_name] : [],
        accessControl: [], // Empty array since we're not using default routes anymore
      }));
      
      setData(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, globalFilter, roleFilter, statusFilter]);

  // Fetch users on component mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async (userId: string) => {
    const user = data.find(u => u.id === userId);
    if (user) {
      openDeleteModal(user);
    }
  };

  const handleClearFilters = () => {
    setGlobalFilter("");
    setRoleFilter(null);
    setStatusFilter(null);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    // Since we're now filtering on the server side, we can just return the data
    // The API will handle the filtering based on the request body
    return data;
  }, [data]);

  // Define columns inside the component to access the handler functions
  const columns = useMemo(() => [
    columnHelper.accessor("firstName", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Name
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <div className="flex items-center">
          <UserCircleIcon className="w-8 h-8 text-gray-400 mr-3" />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {info.getValue()} {info.row.original.lastName}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{info.row.original.email}</div>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("role", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Role
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          info.getValue() === 1 
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        }`}>
          {info.getValue() === 1 ? 'admin' : info.getValue() === 2 ? 'user' : 'manager'}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Status
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          info.getValue() === 'active' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("organisation_name", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Organization
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("createdAt", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Created
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(info.getValue()).toLocaleDateString()}
        </div>
      ),
    }),
    columnHelper.accessor("accessControl", {
      header: "Access Control",
      cell: (info) => {
        return (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => openAccessControlModal(info.row.original)}
              className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors cursor-pointer group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 border border-green-200 dark:border-green-800"
            >
              <span className="text-xs font-medium">View Routes</span>
            </button>
            <button
              onClick={() => openPrivilegesModal(info.row.original)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
            >
              <InformationCircleIcon className="w-4 h-4" />
              <span className="text-xs font-medium">View Privileges</span>
            </button>
          </div>
        );
      },
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
            onClick={() => handleDeleteUser(info.row.original.id)}
            className="p-1 text-red-600 hover:text-red-700"
          >
            <TrashBinIcon className="w-4 h-4" />
          </Button>
        </div>
      ),
    }),
  ], [openModal, handleDeleteUser]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
  });



  // Calculate stats
  const stats = useMemo(() => {
    const total = data.length;
    const active = data.filter(user => user.status === "active").length;
    const inactive = data.filter(user => user.status === "inactive").length;
    const admins = data.filter(user => user.role === 1).length;
    const users = data.filter(user => user.role === 2).length;
    const managers = 0; // Managers not supported in current User type

    return { total, active, inactive, admins, users, managers };
  }, [data]);

  const handleAddNew = () => {
    openModal();
  };

  const handleExport = () => {
    // Implement export functionality
    toast.success('Export functionality coming soon');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading users...</p>

          </div>
        </div>
      </div>
    );
  }

  // Add a check for when data is loaded but empty
  if (!loading && data.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-500 text-6xl mb-4">📭</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Users Found</h2>
            <p className="text-gray-600 mb-4">No users were loaded from the API.</p>
            <Button onClick={() => fetchUsers()} className="bg-blue-600 hover:bg-blue-700">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage system users, roles, and permissions
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <UserCircleIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inactive</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.inactive}</p>
            </div>
            <AlertIcon className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.admins}</p>
            </div>
            <UserCircleIcon className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Users</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.users}</p>
            </div>
            <UserCircleIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Managers</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.managers}</p>
            </div>
            <UserCircleIcon className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters & Controls</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Search Users */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Search Users
              </label>
              <div className="flex">
                <Input
                  placeholder="Search by name, email, or organization..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="flex-1 rounded-r-none border-r-0 focus:ring-blue-500 focus:border-blue-500"
                />
                <Button 
                  onClick={() => fetchUsers()} 
                  size="sm" 
                  className="rounded-l-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Role Filter
              </label>
              <select
                value={roleFilter || ""}
                onChange={(e) => setRoleFilter(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              >
                <option value="">All Roles</option>
                <option value={2}>User</option>
                <option value={1}>Admin</option>
                <option value={3}>Manager</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Status Filter
              </label>
              <select
                value={statusFilter === null ? "" : statusFilter.toString()}
                onChange={(e) => setStatusFilter(e.target.value === "" ? null : e.target.value === "true")}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-end space-x-3">
              <Button 
                onClick={handleClearFilters} 
                size="sm" 
                variant="outline"
                className="px-4 py-2.5 text-sm font-medium border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Clear Filters
              </Button>
              {/* Commented out export option as requested */}
              {/* <Button onClick={handleExport} size="sm" variant="outline" className="px-4 py-2.5">
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export
              </Button> */}
              <Button 
                onClick={handleAddNew} 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>

          {/* Loading Indicator */}
          {filterLoading && (
            <div className="mt-4 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Applying filters...
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden relative">
        {filterLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">Applying filters...</p>
            </div>
          </div>
        )}
        

        
        <div className="overflow-x-auto">
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
                    {loading ? 'Loading...' : 'No users found'}
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
      </div>

      {/* Pagination */}
      {filteredData.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {pagination.pageIndex * pagination.pageSize + 1} to{" "}
            {Math.min(
              (pagination.pageIndex + 1) * pagination.pageSize,
              filteredData.length
            )}{" "}
            of {filteredData.length} results
          </div>
          <Pagination
            currentPage={pagination.pageIndex + 1}
            totalPages={Math.ceil(filteredData.length / pagination.pageSize)}
            onPageChange={(page) => setPagination(prev => ({ ...prev, pageIndex: page - 1 }))}
          />
        </div>
      )}

      {filteredData.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {globalFilter || roleFilter !== null || statusFilter !== null
            ? "No users found matching your filters."
            : "No users found. Add your first user to get started."}
        </div>
      )}

      {/* FormModal Wrapper for User Form */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit User" : "Add New User"}
        size="lg"
        showHeader={true}
        showFooter={true}
      >
        <UserForm
          initialData={editingItem || undefined}
          onSuccess={() => {
            closeModal();
            fetchUsers(); // Refresh the user list
          }}
          onCancel={closeModal}
          isEditing={!!editingItem}
        />
              </FormModal>

                {/* Privileges Modal */}
        <PrivilegeModal
          isOpen={isPrivilegesModalOpen}
          onClose={closePrivilegesModal}
          title={`Privileges for ${selectedUserName}`}
          privileges={selectedUserPrivileges}
          isLoading={isLoadingPrivileges}
          emptyMessage="No privileges assigned to this user."
          emptyDescription="Privileges are inherited from the user's role."
          showFooter={true}
        />

        {/* Access Control Routes Modal */}
        <CommonModalWrapper
          isOpen={isAccessControlModalOpen}
          onClose={closeAccessControlModal}
          title={`Access Control Routes for ${selectedUserForAccessControl ? `${selectedUserForAccessControl.firstName} ${selectedUserForAccessControl.lastName}` : 'User'}`}
          size="2xl"
          showFooter={true}
          footerContent={
            <Button variant="outline" onClick={closeAccessControlModal}>
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              This user has access to <span className="font-medium text-green-600">{selectedUserAccessControl.length}</span> routes across different modules.
            </div>
            
            {selectedUserAccessControl.length > 0 ? (
              <div className="space-y-4">
                {/* Group routes by module */}
                {(() => {
                  // Group routes by module
                  const moduleGroups: Record<string, string[]> = {};
                  
                  selectedUserAccessControl.forEach((route) => {
                    const moduleId = route.split('/')[0]; // Extract module from route (e.g., "admin" from "admin/dashboard")
                    if (!moduleGroups[moduleId]) {
                      moduleGroups[moduleId] = [];
                    }
                    moduleGroups[moduleId].push(route);
                  });
                  
                  return Object.entries(moduleGroups).map(([moduleId, routes]) => {
                    const moduleInfo = getModuleInfo(moduleId);
                    return (
                      <div key={moduleId} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm flex items-center gap-2">
                            <span className={`w-3 h-3 bg-${moduleInfo.color}-500 rounded-full`}></span>
                            {moduleInfo.name}
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                              ({routes.length} routes)
                            </span>
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {moduleInfo.description}
                          </p>
                        </div>
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {routes.map((route) => (
                              <div
                                key={route}
                                className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                              >
                                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                <div className="flex flex-col">
                                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate font-medium">
                                    {route}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {AVAILABLE_ROUTES[route as keyof typeof AVAILABLE_ROUTES] || 'Route description not available'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <InformationCircleIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No access control routes assigned to this user.</p>
                <p className="text-sm mt-1">Routes are inherited from the user's role.</p>
              </div>
            )}
          </div>
        </CommonModalWrapper>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={confirmDeleteUser}
          title="Delete User"
          message="Are you sure you want to delete this user? This action cannot be undone and will remove all associated data and permissions."
          itemName={userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName}` : undefined}
          isLoading={isDeleting}
          variant="danger"
          error={deleteError}
        />
      </div>
    );
  }

export default withSimpleRBAC(AdminUserManagementClient, {
  anyPrivileges: [
    "VIEW_USER_LIST", 
    "CREATE_USER", 
    "UPDATE_USER", 
    "DELETE_USER"
  ]
}); 