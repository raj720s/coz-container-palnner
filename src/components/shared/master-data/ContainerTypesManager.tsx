"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
} from "@tanstack/react-table";


import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { FormModal } from "@/components/ui/modal/FormModal";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import { useFormModal } from "@/hooks/useFormModal";
import { PencilIcon, TrashBinIcon, PlusIcon } from "@/icons";
import Pagination from "@/components/tables/Pagination";

import { containerTypeService } from "@/services";

import { ContainerTypeResponse } from "@/types/api";
import { ContainerTypeFormData } from "@/components/forms/ContainerTypeForm";
import { ContainerTypeForm } from "@/components/forms/ContainerTypeForm";
import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";
import { useAuth } from "@/context/AuthContext";

interface TableMeta<T> {
  editRow: (row: T) => void;
  deleteRow: (id: number) => Promise<void>;
}

interface ContainerTypesManagerProps {
  mode: 'admin' | 'user';
}

const columnHelper = createColumnHelper<ContainerTypeResponse>();

export const ContainerTypesManager: React.FC<ContainerTypesManagerProps> = ({ mode }) => {
  const { can } = useAuth();
  
  // Local state for data management
  const [containerTypes, setContainerTypes] = useState<ContainerTypeResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.ceil(total / pageSize);
  
  // Local state
  const [filters, setFilters] = useState({
    page: 1,
    page_size: 10,
    order_by: "created_on",
    order_type: "desc"
  });
  
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ContainerTypeResponse | null>(null);

  const {
    isOpen: isModalOpen,
    isLoading: isModalLoading,
    editingItem,
    openModal,
    closeModal,
    setLoading: setModalLoading,
  } = useFormModal<ContainerTypeResponse>();

  // Load container types function
  const loadContainerTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await containerTypeService.getContainerTypes(filters);
      setContainerTypes(response.results || []);
      setTotal(response.count || 0);
      setPageSize(filters.page_size);
    } catch (error: any) {
      console.error('Error loading container types:', error);
      setError(error.message || 'Failed to load container types');
    } finally {
      setLoading(false);
    }
  };

  // Load container types on component mount and when filters change
  useEffect(() => {
    loadContainerTypes();
  }, [filters]);

  // Sync table sorting with API filters
  useEffect(() => {
    if (sorting.length > 0) {
      const sortConfig = sorting[0];
      setFilters(prev => ({
        ...prev,
        order_by: sortConfig.id,
        order_type: sortConfig.desc ? 'desc' : 'asc'
      }));
    }
  }, [sorting]);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const columns = [
    columnHelper.accessor("code", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Code
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("name", {
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
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {info.getValue()}
        </span>
      ),
    }),
         columnHelper.accessor("description", {
       header: ({ column }) => (
         <button
           onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
           className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
         >
           Description
           <span className="text-xs">
             {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
           </span>
         </button>
       ),
       cell: (info) => (
         <span className="text-sm text-gray-600 dark:text-gray-400">
           {info.getValue() || "No description"}
         </span>
       ),
     }),
     columnHelper.accessor("capacity", {
       header: ({ column }) => (
         <button
           onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
           className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
         >
           Capacity
           <span className="text-xs">
             {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
           </span>
         </button>
       ),
       cell: (info) => (
         <span className="text-sm text-gray-600 dark:text-gray-400">
           {info.getValue() || "No capacity"}
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
          info.getValue() 
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        }`}>
          {info.getValue() ? "Active" : "Inactive"}
        </span>
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
            onClick={() => (info.table.options.meta as TableMeta<ContainerTypeResponse>)?.editRow(info.row.original)}
            className="p-1"
          >
            <PencilIcon className="w-4 h-4" />
          </Button>
          {can("DELETE_CONTAINER_TYPE") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => (info.table.options.meta as TableMeta<ContainerTypeResponse>)?.deleteRow(info.row.original.id)}
              className="p-1 text-red-600 hover:text-red-700"
            >
              <TrashBinIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    }),
  ];

  const table = useReactTable<ContainerTypeResponse>({
    data: containerTypes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    meta: {
      editRow: (row: ContainerTypeResponse) => {
        openModal(row);
      },
      deleteRow: async (id: number) => {
        if (!can("DELETE_CONTAINER_TYPE")) {
          toast.error("You don't have permission to delete container types");
          return;
        }
        const item = containerTypes.find(ct => ct.id === id);
        if (item) {
          setDeletingItem(item);
          setDeleteModalOpen(true);
        }
      },
    } as TableMeta<ContainerTypeResponse>,
  });

  const handleSubmit = async (formData: ContainerTypeFormData) => {
    try {
      setModalLoading(true);
      if (editingItem) {
        // Update existing container type
        await containerTypeService.updateContainerType(editingItem.id, formData);
        toast.success('Container type updated successfully');
      } else {
        // Create new container type
        await containerTypeService.createContainerType(formData);
        toast.success('Container type created successfully');
      }
      
      // Refresh the list
      await loadContainerTypes();
      closeModal();
    } catch (error: any) {
      console.error('Error saving container type:', error);
      toast.error(error.message || 'Failed to save container type');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    
    if (!can("DELETE_CONTAINER_TYPE")) {
      toast.error("You don't have permission to delete container types");
      setDeleteModalOpen(false);
      setDeletingItem(null);
      return;
    }
    
    try {
      setModalLoading(true);
      await containerTypeService.deleteContainerType(deletingItem.id);
      toast.success('Container type deleted successfully');
      setDeleteModalOpen(false);
      setDeletingItem(null);
      
      // Refresh the list
      await loadContainerTypes();
    } catch (error: any) {
      console.error('Error deleting container type:', error);
      toast.error(error.message || 'Failed to delete container type');
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddNew = () => {
    openModal();
  };

  const filteredData = table.getFilteredRowModel().rows;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Container Type Master
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage container types and their configurations
        </p>
        {mode === 'admin' && (
          <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            🔧 Admin Mode - Full Access
          </div>
        )}
      </div>

      {/* Filters and Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Input
            placeholder="Search container types..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddNew} className="flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            Add Container Type
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
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
            {filteredData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {((filters.page || 1) - 1) * (filters.page_size || 10) + 1} to{" "}
            {Math.min(
              (filters.page || 1) * (filters.page_size || 10),
              total
            )}{" "}
            of {total} results
          </div>
          <Pagination
            currentPage={filters.page || 1}
            totalPages={totalPages}
            onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
          />
        </div>
      )}

      {total === 0 && !loading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No container types found matching your search criteria.
        </div>
      )}

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Container Type" : "Add New Container Type"}
        size="lg"
        showFooter={false}
      >
                 <ContainerTypeForm
           initialData={editingItem ? {
             code: editingItem.code,
             name: editingItem.name,
             description: editingItem.description,
             capacity: editingItem.capacity,
             status: editingItem.status
           } : undefined}
           onSubmit={handleSubmit}
           onCancel={closeModal}
           isLoading={isModalLoading}
         />
      </FormModal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Container Type"
        message={`Are you sure you want to delete the container type "${deletingItem?.name}"? This action cannot be undone.`}
        isLoading={loading}
      />
    </div>
  );
};

export default withSimplifiedRBAC(ContainerTypesManager, {
  privilege: "VIEW_CONTAINER_TYPES",
  module: [50], // Container Management module
  allowSuperUserBypass: true,
  redirectTo: "/dashboard"
});