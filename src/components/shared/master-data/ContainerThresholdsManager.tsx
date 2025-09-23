"use client";

import React, { useState, useEffect } from "react";
// Removed useLocalStorageData - localStorage managed by services
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

import { containerThresholdService, containerTypeService, polService, podService } from "@/services";

// Port data will be loaded via direct API calls when needed

import { ContainerThresholdResponse, ContainerThresholdListRequest } from "@/types/api";
import { ContainerThresholdForm, ContainerThresholdFormData } from "@/components/forms/ContainerThresholdForm";
import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";
import { useAuth } from "@/context/AuthContext";

interface TableMeta<T> {
  editRow: (row: T) => void;
  deleteRow: (id: number) => Promise<void>;
}

interface ContainerThresholdsManagerProps {
  mode: 'admin' | 'user';
}

const columnHelper = createColumnHelper<ContainerThresholdResponse>();

export const ContainerThresholdsManager: React.FC<ContainerThresholdsManagerProps> = ({ mode }) => {
  // Removed useLocalStorageData - localStorage managed by services
  
  const { can } = useAuth();
  
  // Local state for data management
  const [containerThresholds, setContainerThresholds] = useState<ContainerThresholdResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Additional data for form and table display
  const [containerTypes, setContainerTypes] = useState<any[]>([]);
  const [portOfLoading, setPortOfLoading] = useState<any[]>([]);
  const [portOfDischarge, setPortOfDischarge] = useState<any[]>([]);
  
  // Local state for filtering and pagination
  const [filters, setFilters] = useState<ContainerThresholdListRequest>({
    page: 1,
    page_size: 10,
    order_by: "container",
    order_type: "asc"
  });
  
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ContainerThresholdResponse | null>(null);

  const {
    isOpen: isModalOpen,
    isLoading: isModalLoading,
    editingItem,
    openModal,
    closeModal,
    setLoading: setModalLoading,
  } = useFormModal<ContainerThresholdResponse>();

  // Load container thresholds function
  const loadContainerThresholds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await containerThresholdService.getContainerThresholds(filters);
      setContainerThresholds(response.results || []);
      setTotal(response.count || 0);
      setTotalPages(Math.ceil((response.count || 0) / filters.page_size));
    } catch (error: any) {
      console.error('Error loading container thresholds:', error);
      setError(error.message || 'Failed to load container thresholds');
    } finally {
      setLoading(false);
    }
  };

  // Load additional data for form and table display
  const loadAdditionalData = async () => {
    try {
      // Load container types
      const containerTypesResponse = await containerTypeService.getContainerTypes({
        page: 1,
        page_size: 1000,
        order_by: "created_on",
        order_type: "desc"
      });
      setContainerTypes(containerTypesResponse.results || []);
      
      // Load port data
      const polResponse = await polService.getPOLs({ page: 1, page_size: 1000 });
      setPortOfLoading(polResponse.results || []);

      console.log({polResponse});
      
      // Load POD data (assuming podService exists)
      try {
        const podResponse = await podService.getPODs({ page: 1, page_size: 1000 });
        setPortOfDischarge(podResponse.results || []);
      } catch (error) {
        console.warn('POD service not available, skipping POD data load:', error);
        setPortOfDischarge([]);
      }
    } catch (error: any) {
      console.error('Error loading additional data:', error);
    }
  };

  // Load container thresholds on component mount and when filters change
  useEffect(() => {
    loadContainerThresholds();
  }, [filters]);

  // Load additional data for form and table display
  useEffect(() => {
    loadAdditionalData();
  }, []);

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

  // Helper function to get container name by ID
  const getContainerName = (containerId: number) => {
    const container = containerTypes.find((type: any) => type.id === containerId);
    return container ? `${container.code} - ${container.name}` : `ID: ${containerId}`;
  };

  // Helper function to get port name by ID
  const getPortName = (portId: number) => {
    if (Array.isArray(portOfLoading) && portOfLoading.length > 0) {
      // Check if the first item has a 'results' property (POLListResponse structure)
      if (portOfLoading[0] && 'results' in portOfLoading[0]) {
        // It's POLListResponse[] structure
        for (const polResponse of portOfLoading) {
          const port = polResponse.results?.find((p: any) => p.id === portId);
          if (port) return port.name;
        }
      } else {
        // It's directly an array of port objects
        const port = (portOfLoading as any[]).find((p: any) => p.id === portId);
        if (port) return port.name;
      }
    }
    return `ID: ${portId}`;
  };

  // Helper function to get port data for form
  const getPortDataForForm = () => {
    // The thunk returns response.results, so portOfLoading is actually an array of port objects
    // not POLListResponse[] as the type suggests
    if (Array.isArray(portOfLoading) && portOfLoading.length > 0) {
      // Check if the first item has a 'results' property (POLListResponse structure)
      if (portOfLoading[0] && 'results' in portOfLoading[0]) {
        // It's POLListResponse[] structure
        const ports: any[] = [];
        portOfLoading.forEach(polResponse => {
          if (polResponse.results) {
            ports.push(...polResponse.results);
          }
        });
        return ports;
      } else {
        // It's directly an array of port objects
        return portOfLoading;
      }
    }
    return [];
  };

  const columns = [
    columnHelper.accessor("container", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Container
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {getContainerName(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor("port_of_loading", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Port of Loading
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {info.getValue() ? getPortName(info.getValue()) : "Default (All POLs)"}
        </span>
      ),
    }),
    columnHelper.accessor("type", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Container Type
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
    columnHelper.accessor("min_capacity", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Min Capacity
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
    columnHelper.accessor("max_capacity", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Max Capacity
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
            onClick={() => (info.table.options.meta as TableMeta<ContainerThresholdResponse>)?.editRow(info.row.original)}
            className="p-1"
          >
            <PencilIcon className="w-4 h-4" />
          </Button>
          {can("DELETE_THRESHOLD") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => (info.table.options.meta as TableMeta<ContainerThresholdResponse>)?.deleteRow(info.row.original.id)}
              className="p-1 text-red-600 hover:text-red-700"
            >
              <TrashBinIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    }),
  ];

  const table = useReactTable<ContainerThresholdResponse>({
    data: containerThresholds,
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
      editRow: (row: ContainerThresholdResponse) => {
        openModal(row);
      },
      deleteRow: async (id: number) => {
        if (!can("DELETE_THRESHOLD")) {
          toast.error("You don't have permission to delete container thresholds");
          return;
        }
        const item = containerThresholds.find(ct => ct.id === id);
        if (item) {
          setDeletingItem(item);
          setDeleteModalOpen(true);
        }
      },
    } as TableMeta<ContainerThresholdResponse>,
  });

  const handleSubmit = async (formData: ContainerThresholdFormData) => {
    try {
      setModalLoading(true);
      if (editingItem) {
        // Update existing threshold
        await containerThresholdService.updateContainerThreshold(editingItem.id, formData);
        toast.success('Container threshold updated successfully');
      } else {
        // Create new threshold
        await containerThresholdService.createContainerThreshold(formData);
        toast.success('Container threshold created successfully');
      }
      
      // Refresh the list
      await loadContainerThresholds();
      closeModal();
    } catch (error: any) {
      console.error('Error saving container threshold:', error);
      toast.error(error.message || 'Failed to save container threshold');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    
    if (!can("DELETE_THRESHOLD")) {
      toast.error("You don't have permission to delete container thresholds");
      setDeleteModalOpen(false);
      setDeletingItem(null);
      return;
    }
    
    try {
      setModalLoading(true);
      await containerThresholdService.deleteContainerThreshold(deletingItem.id);
      toast.success('Container threshold deleted successfully');
      setDeleteModalOpen(false);
      setDeletingItem(null);
      
      // Refresh the list
      await loadContainerThresholds();
    } catch (error: any) {
      console.error('Error deleting container threshold:', error);
      toast.error(error.message || 'Failed to delete container threshold');
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddNew = () => {
    openModal();
  };

  const filteredData = table.getFilteredRowModel().rows;

  if (loading && containerThresholds.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading container thresholds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Threshold Configuration
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage container capacity thresholds and constraints
        </p>
        {mode === 'admin' && (
          <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            🔧 Admin Mode - Full Access
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Input
            placeholder="Search thresholds..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddNew} className="flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            Add Threshold
          </Button>
        </div>
      </div>

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
          No container thresholds found matching your search criteria.
        </div>
      )}

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Container Threshold" : "Add New Container Threshold"}
        size="lg"
        showFooter={false}
      >
        <ContainerThresholdForm
          initialData={editingItem ? {
            container: editingItem.container,
            port_of_loading: editingItem.port_of_loading,
            type: editingItem.type,
            min_capacity: editingItem.min_capacity,
            max_capacity: editingItem.max_capacity,
            status: editingItem.status,
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={isModalLoading}
          containerTypes={containerTypes}
          portOfLoading={portOfLoading}
          portOfDischarge={portOfDischarge}
        />
      </FormModal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Container Threshold"
        message={`Are you sure you want to delete the container threshold "${deletingItem?.type}"? This action cannot be undone.`}
        isLoading={loading}
      />
    </div>
  );
};

export default withSimplifiedRBAC(ContainerThresholdsManager, {
  privilege: "VIEW_CONTAINER_THRESHOLDS",
  module: [50], // Container Management module
  allowSuperUserBypass: true,
  redirectTo: "/dashboard"
});
