"use client";

import { withAnyPrivilegeRBAC } from "@/components/auth/withRBACAuth";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, getSortedRowModel, getFilteredRowModel, getPaginationRowModel } from "@tanstack/react-table";
import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";

import { FormModal } from "@/components/ui/modal/FormModal";
import { UserForm, type UserFormData } from "@/components/forms/UserForm";
import { useFormModal } from "@/hooks/useFormModal";
import Input from "@/components/form/input/InputField";
import { DownloadIcon, AlertIcon, CheckCircleIcon, TimeIcon, UserCircleIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { User } from "@/types/user";
import { AccessControlDisplay } from "@/components/user/AccessControlDisplay";
import Pagination from "@/components/tables/Pagination";
import { userService } from "@/services/userService";
import { CreateUserRequest, UserDetailResponse, UserListResponse } from "@/types/api";

const columnHelper = createColumnHelper<User>();

function AdminUserManagementPage() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const {
    isOpen: isModalOpen,
    isLoading: isModalLoading,
    editingItem,
    openModal,
    closeModal,
    setLoading: setModalLoading,
  } = useFormModal<User>();

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response: UserListResponse = await userService.getUsers({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: globalFilter || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      
      // Transform API response to match our User type
      const transformedUsers: User[] = response.data.map(apiUser => ({
        id: apiUser.id.toString(),
        firstName: apiUser.first_name,
        lastName: apiUser.last_name,
        email: apiUser.email,
        role: (apiUser.role_id === 0 ? 2 : apiUser.role_id) as 1 | 2, // Map 0 to 2 (user), keep 1 as admin
        status: apiUser.is_active ? "active" : "inactive",
        lastLogin: apiUser.updated_on || apiUser.created_on,
        createdAt: apiUser.created_on,
        organisation_name: apiUser.organisation_name || "",
        permissions: apiUser.role_details ? [apiUser.role_details.name] : [],
        accessControl: getDefaultAccessControl(apiUser.role_id),
      }));
      
      setData(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreateUser = async (userData: CreateUserRequest) => {
    try {
      setModalLoading(true);
      
      // Call the user service to create user
      const response = await userService.createUser(userData);
      
      toast.success('User created successfully');
      
      // Refresh the user list
      await fetchUsers();
      
      // Close the modal
      closeModal();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditUser = async (userData: CreateUserRequest) => {
    if (!editingItem) return;
    
    try {
      setModalLoading(true);
      
      // Call the user service to update user
      const response = await userService.updateUser(parseInt(editingItem.id), userData);
      
      toast.success('User updated successfully');
      
      // Refresh the user list
      await fetchUsers();
      
      // Close the modal
      closeModal();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setModalLoading(false);
    }
  };

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

  const handleSubmit = async (userData: CreateUserRequest) => {
    if (editingItem) {
      await handleEditUser(userData);
    } else {
      await handleCreateUser(userData);
    }
  };

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = globalFilter === "" || 
        item.firstName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.lastName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.email.toLowerCase().includes(globalFilter.toLowerCase()) ||
        (item.organisation_name || "").toLowerCase().includes(globalFilter.toLowerCase());
      
      const matchesRole = roleFilter === null || item.role === roleFilter;
      const matchesStatus = statusFilter === null || 
        (statusFilter === true && item.status === "active") ||
        (statusFilter === false && item.status === "inactive");
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [data, globalFilter, roleFilter, statusFilter]);

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
        <AccessControlDisplay accessControl={info.getValue()} />
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
            <Input
              placeholder="Search by name, email, or organization..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full"
            />
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
            <Button onClick={handleExport} size="sm" variant="outline">
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleAddNew} size="sm">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
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
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredData.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length} results
          </div>
          <Pagination
            currentPage={table.getState().pagination.pageIndex + 1}
            totalPages={table.getPageCount()}
            onPageChange={(page) => table.setPageIndex(page - 1)}
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

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit User" : "Add New User"}
        isLoading={isModalLoading}
        size="lg"
        showFooter={false}
        onSubmit={() => {}} // Dummy onSubmit since we're handling form submission in UserForm
      >
        <UserForm
          initialData={editingItem || undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={isModalLoading}
        />
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