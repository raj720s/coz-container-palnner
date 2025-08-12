"use client";

import { withAdminAuth } from "@/components/auth/withAuth";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, getSortedRowModel, getFilteredRowModel } from "@tanstack/react-table";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";

import { FormModal } from "@/components/ui/modal/FormModal";
import { UserForm } from "@/components/forms/UserForm";
import { useFormModal } from "@/hooks/useFormModal";
import Input from "@/components/form/input/InputField";
import { DownloadIcon, AlertIcon, CheckCircleIcon, TimeIcon, UserCircleIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { User } from "@/types/user";
import { AccessControlDisplay } from "@/components/user/AccessControlDisplay";

const columnHelper = createColumnHelper<User>();

function AdminUserManagementPage() {
  const [data, setData] = useState<User[]>([
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@company.com",
      role: "admin",
      status: "active",
      lastLogin: "2024-01-15T10:30:00Z",
      createdAt: "2023-06-15T09:00:00Z",
      department: "Operations",
      permissions: ["read", "write", "admin"],
      accessControl: [
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
      ]
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@company.com",
      role: "user",
      status: "active",
      lastLogin: "2024-01-14T14:20:00Z",
      createdAt: "2023-08-20T11:00:00Z",
      department: "Logistics",
      permissions: ["read", "write"],
      accessControl: [
        "user/dashboard",
        "user/shipment-upload",
        "user/container-planning",
        "user/assignment-results",
        "user/validation-summary",
        "user/repositioning-summary",
      ]
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike.johnson@company.com",
      role: "user",
      status: "inactive",
      lastLogin: "2024-01-10T16:45:00Z",
      createdAt: "2023-09-10T10:30:00Z",
      department: "Sales",
      permissions: ["read"],
      accessControl: [
        "user/dashboard",
        "user/shipment-upload",
        "user/assignment-results",
      ]
    },
    {
      id: "4",
      name: "Sarah Wilson",
      email: "sarah.wilson@company.com",
      role: "admin",
      status: "active",
      lastLogin: "2024-01-15T08:15:00Z",
      createdAt: "2023-07-05T13:20:00Z",
      department: "IT",
      permissions: ["read", "write", "admin"],
      accessControl: [
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
      ]
    },
    {
      id: "5",
      name: "David Brown",
      email: "david.brown@company.com",
      role: "user",
      status: "pending",
      lastLogin: "2024-01-12T12:00:00Z",
      createdAt: "2024-01-12T09:00:00Z",
      department: "Finance",
      permissions: ["read"],
      accessControl: [
        "user/dashboard",
        "user/shipment-upload",
        "user/assignment-results",
      ]
    }
  ]);

  const [globalFilter, setGlobalFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const {
    isOpen: isModalOpen,
    isLoading: isModalLoading,
    editingItem,
    openModal,
    closeModal,
    setLoading,
  } = useFormModal();

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setData(prev => prev.filter(user => user.id !== userId));
      toast.success("User deleted successfully");
    }
  };

  const handleExportUsers = () => {
    toast.success("Exporting user data...");
  };

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingItem) {
        // Update existing user
        setData(prev => prev.map(user =>
          user.id === editingItem.id
            ? { 
                ...user, 
                ...formData,
                permissions: formData.role === "admin" ? ["read", "write", "admin"] : ["read", "write"],
                accessControl: formData.accessControl || []
              }
            : user
        ));
        toast.success("User updated successfully");
      } else {
        // Add new user
        const newUser: User = {
          id: Date.now().toString(),
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          department: formData.department,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          permissions: formData.role === "admin" ? ["read", "write", "admin"] : ["read", "write"],
          accessControl: formData.accessControl || []
        };
        setData(prev => [...prev, newUser]);
        toast.success("User created successfully");
      }
      
      closeModal();
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    console.log("add new");
    openModal();
  };

  const getSummaryStats = () => {
    const total = data.length;
    const active = data.filter(item => item.status === "active").length;
    const inactive = data.filter(item => item.status === "inactive").length;
    const pending = data.filter(item => item.status === "pending").length;
    const admins = data.filter(item => item.role === "admin").length;
    const users = data.filter(item => item.role === "user").length;

    return { total, active, inactive, pending, admins, users };
  };

  const stats = useMemo(() => getSummaryStats(), [data]);

  // Filter data based on role and status filters
  const filteredData = useMemo(() => data.filter(item => {
    const matchesRole = roleFilter === "all" || item.role === roleFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesRole && matchesStatus;
  }), [data, roleFilter, statusFilter]);

  // Define columns inside the component to access the handler functions
  const columns = useMemo(() => [
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center">
            <UserCircleIcon className="w-5 h-5 text-brand-600" />
          </div>
          <span className="font-medium text-gray-900 dark:text-white">
            {info.getValue()}
          </span>
        </div>
      ),
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("role", {
      header: "Role",
      cell: (info) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          info.getValue() === "admin" 
            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        }`}>
          {info.getValue().charAt(0).toUpperCase() + info.getValue().slice(1)}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => {
        const status = info.getValue();
        const statusConfig = {
          active: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: CheckCircleIcon },
          inactive: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: AlertIcon },
          pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: TimeIcon }
        };
        const config = statusConfig[status];
        const Icon = config.icon;
        return (
          <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${config.color}`}>
            <Icon className="w-3 h-3" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    }),
    columnHelper.accessor("department", {
      header: "Department",
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {info.getValue() || "-"}
        </span>
      ),
    }),
    columnHelper.accessor("lastLogin", {
      header: "Last Login",
      cell: (info) => (
        <span className="text-sm text-gray-500 dark:text-gray-500">
          {new Date(info.getValue()).toLocaleDateString()}
        </span>
      ),
    }),
    columnHelper.accessor("createdAt", {
      header: "Created",
      cell: (info) => (
        <span className="text-sm text-gray-500 dark:text-gray-500">
          {new Date(info.getValue()).toLocaleDateString()}
        </span>
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
        <div className="flex gap-2">
          <button
            onClick={() => openModal(info.row.original)}
            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteUser(info.row.original.id)}
            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            <TrashBinIcon className="w-4 h-4" />
          </button>
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
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
  });

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
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
            </div>
            <TimeIcon className="w-8 h-8 text-yellow-600" />
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
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search users..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
          <Button onClick={handleAddNew} size="sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add User
          </Button>
          <Button onClick={handleExportUsers} size="sm" variant="outline">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
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
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    row.original.status === "inactive" ? "bg-red-50 dark:bg-red-900/20" : ""
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {table.getRowModel().rows.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No users found matching your criteria.
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
      >
        <UserForm
          initialData={editingItem}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={isModalLoading}
        />
      </FormModal>
    </div>
  );
}

export default withAdminAuth(AdminUserManagementPage); 