"use client";

import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, SortingState } from "@tanstack/react-table";
import { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";

import { UserForm, type UserFormData } from "@/components/forms/UserForm";
import { FormModal } from "@/components/ui/modal/FormModal";
// Removed CommonModalWrapper - no longer needed
// Removed PrivilegeModal - using role management for privilege viewing
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import Input from "@/components/form/input/InputField";
import { DownloadIcon, AlertIcon, CheckCircleIcon, TimeIcon, UserCircleIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { User } from "@/types/user";

import Pagination from "@/components/tables/Pagination";
import { userService } from "@/services/userService";
import { UserListResponseV2 } from "@/types/api";
import { roleService, RoleResponse } from "@/services/roleService";

// Removed useRoles - using roleService directly
import { staticModuleDefinitions } from "@/config/staticModules";

const columnHelper = createColumnHelper<User>();

function AdminUserManagementClient() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);



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

  // Removed privilege and access control modal states - using role management instead

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get roles from Redux
  // State for roles
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  
  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await roleService.getRoles();
        setRoles(response);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };
    fetchRoles();
  }, []);



  // Helper function to get module info
  const getModuleInfo = (moduleId: string) => {
    const module = staticModuleDefinitions.modules[parseInt(moduleId)];
    return module || {
      name: 'Unknown Module',
      description: 'Module information not available',
      color: 'gray'
    };
  };

  // Removed privilege and access control modal functions - using role management instead

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
        first_name: nameSearch || undefined,
        // last_name: nameSearch || undefined, // Commented out - only searching first name
        // email: globalFilter || undefined, // Commented out - not using global filter for email
        // organisation_name: globalFilter || undefined, // Commented out - not using global filter for organization
        role_name: roleFilter === 1 ? 'admin' : roleFilter === 2 ? 'user' : roleFilter === 3 ? 'manager' : undefined,
        status: statusFilter !== null ? (statusFilter ? 1 : 0) : undefined,
        order_by: sorting.length > 0 ? sorting[0].id : undefined,
        order_type: sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
        export: false,
      };
      
      const response = await userService.getUsers(requestBody);
      
      // Set total count for pagination
      setTotalCount(response.count);
      
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
  }, [pagination.pageIndex, pagination.pageSize, nameSearch, roleFilter, statusFilter, sorting]);

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
    // setGlobalFilter(""); // Commented out - not using global filter
    setNameSearch("");
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
    // Removed Access Control column - using role management for privilege viewing
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
      // globalFilter, // Commented out - not using global filter
      pagination,
      sorting,
    },
    onSortingChange: setSorting,
    // onGlobalFilterChange: setGlobalFilter, // Commented out - not using global filter
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
                  placeholder="Search by first name..."
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
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
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
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

        {/* Mobile Cards */}
        <div className="lg:hidden">
          {table.getRowModel().rows.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              {loading ? 'Loading...' : 'No users found'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {table.getRowModel().rows.map((row) => (
                <div key={row.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="space-y-3">
                    {/* User Name and Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <UserCircleIcon className="w-8 h-8 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {row.original.firstName} {row.original.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{row.original.email}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        row.original.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {row.original.status}
                      </span>
                    </div>

                    {/* Role and Organization */}
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Role:</span>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {row.original.role === 1 ? 'admin' : row.original.role === 2 ? 'user' : 'manager'}
                        </p>
                      </div>
                      {row.original.organisation_name && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Organization:</span>
                          <p className="text-sm text-gray-900 dark:text-white">{row.original.organisation_name}</p>
                        </div>
                      )}
                    </div>

                    {/* Created Date */}
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Created:</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(row.original.createdAt).toLocaleDateString()}
                      </p>
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
                          onClick={() => handleDeleteUser(row.original.id)}
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
      {filteredData.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700 dark:text-gray-300 order-2 sm:order-1">
            Showing {pagination.pageIndex * pagination.pageSize + 1} to{" "}
            {Math.min(
              (pagination.pageIndex + 1) * pagination.pageSize,
              totalCount
            )}{" "}
            of {totalCount} results
          </div>
          <div className="order-1 sm:order-2">
            <Pagination
              currentPage={pagination.pageIndex + 1}
              totalPages={Math.ceil(totalCount / pagination.pageSize)}
              onPageChange={(page) => setPagination(prev => ({ ...prev, pageIndex: page - 1 }))}
            />
          </div>
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

        {/* Removed Privilege and Access Control modals - using role management instead */}

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

export default withSimplifiedRBAC(AdminUserManagementClient, {
  privilege: "VIEW_USER_LIST"
}); 