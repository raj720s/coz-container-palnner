"use client";

import { withAdminRBAC } from "@/components/auth/withRBACAuth";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, getSortedRowModel, getFilteredRowModel, getPaginationRowModel } from "@tanstack/react-table";
import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";
import { FormModal } from "@/components/ui/modal/FormModal";
import { useFormModal } from "@/hooks/useFormModal";
import Input from "@/components/form/input/InputField";
import { DownloadIcon, AlertIcon, CheckCircleIcon, UserCircleIcon, PencilIcon, PlusIcon, TrashBinIcon, EyeIcon, InformationCircleIcon } from "@/icons";
import Pagination from "@/components/tables/Pagination";
import { roleService } from "@/services/roleService";
import { RoleResponse, CreateRoleRequest, UpdateRoleRequest, PrivilegeResponse } from "@/services/roleService";
import { RoleForm } from "@/components/forms/RoleForm";
import moduleDefinitions from "@/config/modules.json";

const columnHelper = createColumnHelper<RoleResponse>();

// Helper function to get module information
const getModuleInfo = (moduleId: string) => {
  const module = moduleDefinitions.modules[moduleId as keyof typeof moduleDefinitions.modules];
  return module || {
    name: `Module ${moduleId}`,
    description: "Unknown module",
    icon: "AlertIcon",
    color: "gray"
  };
};

function AdminRoleManagementPage() {
  const [data, setData] = useState<RoleResponse[]>([]);
  const [privileges, setPrivileges] = useState<PrivilegeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
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
  } = useFormModal<RoleResponse>();

  // Privileges modal state
  const [isPrivilegesModalOpen, setIsPrivilegesModalOpen] = useState(false);
  const [selectedRolePrivileges, setSelectedRolePrivileges] = useState<string[]>([]);
  const [selectedRoleName, setSelectedRoleName] = useState("");

  // Fetch roles and privileges on component mount
  useEffect(() => {
    fetchRoles();
    fetchPrivileges();
  }, []);

  // Refetch roles when filters change
  useEffect(() => {
    if (!loading) {
      fetchRoles();
    }
  }, [globalFilter, pagination.pageIndex, pagination.pageSize]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      
      const response = await roleService.getRoles({
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        role_name: globalFilter || undefined,
        include_privilege_data: true,
        order_by: 'created_on',
        order_type: 'desc'
      });
      
      console.log('Roles API response:', response); // Debug log
      setData(response.results);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrivileges = async () => {
    try {
      const response = await roleService.getPrivileges({
        page: 1,
        page_size: 1000, // Get all privileges
        order_by: 'privilege_name',
        order_type: 'asc'
      });
      console.log('Privileges API response:', response); // Debug log
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
      await fetchRoles();
      
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
      await fetchRoles();
      
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
    if (!window.confirm('Are you sure you want to delete this role?')) {
      return;
    }
    
    try {
      await roleService.deleteRole(roleId);
      
      toast.success('Role deleted successfully');
      
      // Refresh the role list
      await fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    }
  };



  const handleSubmit = async (roleData: CreateRoleRequest | UpdateRoleRequest) => {
    if (editingItem) {
      await handleEditRole(roleData as UpdateRoleRequest);
    } else {
      await handleCreateRole(roleData as CreateRoleRequest);
    }
  };

  const openPrivilegesModal = (role: RoleResponse) => {
    setSelectedRolePrivileges(role.privilege_names || []);
    setSelectedRoleName(role.role_name);
    setIsPrivilegesModalOpen(true);
  };

  const closePrivilegesModal = () => {
    setIsPrivilegesModalOpen(false);
    setSelectedRolePrivileges([]);
    setSelectedRoleName("");
  };

  // Filter data based on search
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = globalFilter === "" || 
        item.role_name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.role_description.toLowerCase().includes(globalFilter.toLowerCase());
      
      return matchesSearch;
    });
  }, [data, globalFilter]);

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
    columnHelper.accessor("privilege_names", {
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
            <span className="font-medium">{info.getValue()?.length || 0}</span>
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
          {info.row.original.created_by || 'System'}
        </div>
      ),
    }),
    columnHelper.accessor("created_at", {
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
          {new Date(info.getValue()).toLocaleDateString()}
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
          {info.row.original.modified_by || '-'}
        </div>
      ),
    }),
    columnHelper.accessor("updated_at", {
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
          {info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '-'}
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
            onClick={() => handleDeleteRole(info.row.original.id)}
            className="p-1 text-red-600 hover:text-red-700"
          >
            <TrashBinIcon className="w-4 h-4" />
          </Button>
        </div>
      ),
    }),
  ], [openModal, handleDeleteRole]);

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
    const active = data.filter(role => role.is_active).length;
    
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
  }, [data, privileges]);

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading roles...</p>
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
               placeholder="Search roles..."
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
             <Button onClick={handleAddNew} size="sm">
               <PlusIcon className="w-4 h-4 mr-2" />
               Add Role
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
              filteredData.length
            )}{" "}
            of {filteredData.length} results
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
          {globalFilter
            ? "No roles found matching your search criteria."
            : "No roles found. Add your first role to get started."}
        </div>
      )}

             {/* Form Modal */}
       <FormModal
         isOpen={isModalOpen}
         onClose={closeModal}
         title={editingItem ? "Edit Role" : "Add New Role"}
         isLoading={isModalLoading}
         size="lg"
         showFooter={false}
         onSubmit={() => {}} // Dummy onSubmit since we're handling form submission in RoleForm
       >
         <RoleForm
           initialData={editingItem || undefined}
           privileges={privileges}
           onSubmit={handleSubmit}
           onCancel={closeModal}
           isLoading={isModalLoading}
         />
       </FormModal>

               {/* Privileges Modal */}
        <FormModal
          isOpen={isPrivilegesModalOpen}
          onClose={closePrivilegesModal}
          title={`Privileges for ${selectedRoleName}`}
          size="2xl"
          showFooter={false}
          onSubmit={() => {}}
        >
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              This role has <span className="font-medium text-blue-600">{selectedRolePrivileges.length}</span> privileges assigned across different modules.
            </div>
            
            {selectedRolePrivileges.length > 0 ? (
              <div className="space-y-4">
                {/* Group privileges by module */}
                {(() => {
                  // Group privileges by module using the privileges data
                  const moduleGroups: Record<string, string[]> = {};
                  
                  if (privileges && privileges.results) {
                    privileges.results.forEach((privilegeItem) => {
                      const moduleId = privilegeItem.module_id;
                      if (selectedRolePrivileges.includes(privilegeItem.privilege_name)) {
                        if (!moduleGroups[moduleId]) {
                          moduleGroups[moduleId] = [];
                        }
                        moduleGroups[moduleId].push(privilegeItem.privilege_name);
                      }
                    });
                  }
                  
                                     return Object.entries(moduleGroups).map(([moduleId, modulePrivileges]) => {
                     const moduleInfo = getModuleInfo(moduleId);
                     return (
                     <div key={moduleId} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                       <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                         <h4 className="font-medium text-gray-900 dark:text-white text-sm flex items-center gap-2">
                           <span className={`w-3 h-3 bg-${moduleInfo.color}-500 rounded-full`}></span>
                           {moduleInfo.name}
                           <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                             ({modulePrivileges.length} privileges)
                           </span>
                         </h4>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                           {moduleInfo.description}
                         </p>
                       </div>
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {modulePrivileges.map((privilege, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                            >
                              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                {privilege}
                              </span>
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
                <p>No privileges assigned to this role.</p>
                <p className="text-sm mt-1">You can assign privileges when editing the role.</p>
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
        </FormModal>
     </div>
   );
 }

export default withAdminRBAC(AdminRoleManagementPage);
