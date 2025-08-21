"use client";

import { withAnyPrivilegeRBAC } from "@/components/auth/withRBACAuth";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, getSortedRowModel, getFilteredRowModel, getPaginationRowModel } from "@tanstack/react-table";
import { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";

import { UserForm, type UserFormData } from "@/components/forms/UserForm";
import { FormModal } from "@/components/ui/modal/FormModal";
import Input from "@/components/form/input/InputField";
import { DownloadIcon, AlertIcon, CheckCircleIcon, TimeIcon, UserCircleIcon, PencilIcon, PlusIcon, TrashBinIcon, InformationCircleIcon } from "@/icons";
import { User } from "@/types/user";
import { AccessControlDisplay } from "@/components/user/AccessControlDisplay";
import Pagination from "@/components/tables/Pagination";
import { userService } from "@/services/userService";
import { UserListResponseV2 } from "@/types/api";
import { roleService } from "@/services/roleService";
import { useRoles } from "@/hooks/useRoles";
import moduleDefinitions from "@/config/modules.json";

const columnHelper = createColumnHelper<User>();

function AdminUserManagementPage() {
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

  console.log('Component state:', { data, loading, filterLoading, globalFilter, roleFilter, statusFilter, pagination });

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

  // Get roles from Redux
  const { roles } = useRoles();

  const getDefaultAccessControl = (roleId: number): string[] => {
    if (roleId === 1) {
      return [
        "admin/dashboard",
        "admin/user-management",
        "admin/container-types",
        "admin/container-thresholds",
        "admin/port-customer-master",
        "admin/shipment-upload",
        "admin/container-planning",
        "admin/assignment-results",
        "admin/repositioning-summary",
        "admin/validation-summary",
        "admin/data-backup",
        "admin/system-settings",
        "user/dashboard",
        "user/shipment-upload",
        "user/container-planning",
        "user/assignment-results",
        "user/validation-summary",
        "user/repositioning-summary",
      ];
    } else {
      return [
        "user/dashboard",
        "user/shipment-upload",
        "user/container-planning",
        "user/assignment-results",
        "user/validation-summary",
        "user/repositioning-summary",
      ];
    }
  };

  // Helper function to get module info
  const getModuleInfo = (moduleId: string) => {
    return moduleDefinitions[moduleId as keyof typeof moduleDefinitions] || {
      name: 'Unknown Module',
      description: 'Module information not available',
      color: 'gray'
    };
  };

  // Function to open privileges modal for a user
  const openPrivilegesModal = async (user: User) => {
    console.log('🔍 Opening privileges modal for user:', user);
    console.log('📊 User role:', user.role);
    
    setIsLoadingPrivileges(true);
    
    try {
      // Find the role for this user
      const userRole = roles.find(role => role.id === user.role.toString());
      console.log('📊 Found user role:', userRole);
      
      if (userRole) {
        // Fetch privileges for this specific role
        const rolePrivileges = await roleService.getPrivilegesByRole(parseInt(userRole.id));
        console.log('📊 Role privileges response:', rolePrivileges);
        console.log('📊 Role privileges results:', rolePrivileges.results);
        
        // Extract privilege names from the response
        const privilegeNames = rolePrivileges.results?.map(p => p.privilege_name) || [];
        console.log('📊 Extracted privilege names:', privilegeNames);
        console.log('📊 Privilege names length:', privilegeNames.length);
        
        setSelectedUserPrivileges(privilegeNames);
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
      
      console.log('API Response:', response);
      console.log('Response results:', response.results);
      
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
        accessControl: getDefaultAccessControl(apiUser.is_superuser ? 1 : 2),
      }));
      
      console.log('Transformed users:', transformedUsers);
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
    console.log('useEffect triggered with:', { pagination, globalFilter, roleFilter, statusFilter });
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      // Call the user service to delete user
      await userService.deleteUser(parseInt(userId));
      
      toast.success('User deleted successfully');
      
      // Refresh the user list
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
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
    console.log('Filtered data:', data);
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
      cell: (info) => (
        <div className="flex items-center gap-2">
          <AccessControlDisplay accessControl={info.getValue()} />
          <button
            onClick={() => openPrivilegesModal(info.row.original)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer group flex items-center gap-1"
          >
            <InformationCircleIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-xs">View Privileges</span>
          </button>
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

  console.log('Table data:', filteredData);
  console.log('Table rows:', table.getRowModel().rows);

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
            <p className="text-sm text-gray-500">Debug: Loading state active</p>
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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Users
            </label>
            <div className="flex">
              <Input
                placeholder="Search by name, email, or organization..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full rounded-r-none"
              />
              <Button 
                onClick={() => fetchUsers()} 
                size="sm" 
                className="rounded-l-none px-4"
              >
                Search
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role Filter
            </label>
            <select
              value={roleFilter || ""}
              onChange={(e) => setRoleFilter(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Roles</option>
              <option value={2}>User</option>
              <option value={1}>Admin</option>
              <option value={3}>Manager</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status Filter
            </label>
            <select
              value={statusFilter === null ? "" : statusFilter.toString()}
              onChange={(e) => setStatusFilter(e.target.value === "" ? null : e.target.value === "true")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="flex items-end space-x-2">
            <Button onClick={handleClearFilters} size="sm" variant="outline">
              Clear Filters
            </Button>
            <Button onClick={handleExport} size="sm" variant="outline">
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleAddNew} size="sm">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add User
            </Button>
            {filterLoading && (
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Loading...
              </div>
            )}
          </div>
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
        
        {/* Debug info */}
        <div className="p-4 bg-gray-100 dark:bg-gray-700 text-sm">
          <p>Debug: Data length: {data.length}, Filtered data length: {filteredData.length}</p>
          <p>Loading: {loading.toString()}, Filter Loading: {filterLoading.toString()}</p>
        </div>
        
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
        <FormModal
          isOpen={isPrivilegesModalOpen}
          onClose={closePrivilegesModal}
          title={`Privileges for ${selectedUserName}`}
          size="2xl"
          showHeader={true}
          showFooter={false}
        >
          <div className="space-y-4">
            {isLoadingPrivileges ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading privileges...</p>
              </div>
            ) : (
              <div key="privileges-content">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  This user has <span className="font-medium text-blue-600">{selectedUserPrivileges.length}</span> privileges assigned through their role.
                </div>
                
                {selectedUserPrivileges.length > 0 ? (
                  <div className="space-y-4">
                    {/* Group privileges by module */}
                    {(() => {
                      // Group privileges by module using the privileges data
                      const moduleGroups: Record<string, string[]> = {};
                      
                      console.log('🔍 Grouping user privileges:', {
                        selectedUserPrivileges,
                        rolesData: roles
                      });
                      
                      // For now, show privileges as ungrouped list since we don't have module data
                      // In a real implementation, you might want to fetch privilege details with module info
                      
                      return (
                        <div key="ungrouped" className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                              All Privileges ({selectedUserPrivileges.length})
                            </h4>
                          </div>
                          <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {selectedUserPrivileges.map((privilege) => (
                                <div
                                  key={`ungrouped-${privilege}`}
                                  className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                                >
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                    {privilege}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <InformationCircleIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No privileges assigned to this user.</p>
                    <p className="text-sm mt-1">Privileges are inherited from the user's role.</p>
                  </div>
                )}
                
                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={closePrivilegesModal}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </FormModal>
      </div>
    );
  }

export default withAnyPrivilegeRBAC(AdminUserManagementPage, [
  "VIEW_USER_LIST", 
  "CREATE_USER", 
  "UPDATE_USER", 
  "DELETE_USER"
]); 