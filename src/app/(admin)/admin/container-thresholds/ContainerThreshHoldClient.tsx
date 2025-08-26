"use client";

import { withSimpleRBAC } from "@/components/auth/withSimpleRBAC";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { FormModal } from "@/components/ui/modal/FormModal";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import { useFormModal } from "@/hooks/useFormModal";
import { PencilIcon, TrashBinIcon, PlusIcon } from "@/icons";
import { toast } from "react-hot-toast";
import React, { useState, useEffect } from "react";
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
import Pagination from "@/components/tables/Pagination";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  fetchContainerThresholds,
  createContainerThreshold,
  updateContainerThreshold,
  patchContainerThreshold,
  deleteContainerThreshold,
  selectContainerThresholds,
  selectContainerThresholdsLoading,
  selectContainerThresholdsError,
  selectContainerThresholdsTotal,
  selectContainerThresholdsTotalPages,
  clearError,
} from "@/store/slices/containerThresholdSlice";
import { 
  fetchContainerTypes, 
  selectContainerTypes 
} from "@/store/slices/containerTypeSlice";
import { 
  selectPortOfLoading, 
  selectPortOfDischarge, 
  fetchPortOfLoading, 
  fetchPortOfDischarge 
} from "@/store/slices/commonDataSlice";
import { ContainerThresholdResponse, ContainerThresholdListRequest } from "@/types/api";
import { ContainerThresholdForm, ContainerThresholdFormData } from "@/components/forms/ContainerThresholdForm";

interface TableMeta<T> {
  editRow: (row: T) => void;
  deleteRow: (id: number) => Promise<void>;
}

const columnHelper = createColumnHelper<ContainerThresholdResponse>();

function ContainerThresholdPage() {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const containerThresholds = useSelector(selectContainerThresholds);
  const loading = useSelector(selectContainerThresholdsLoading);
  const error = useSelector(selectContainerThresholdsError);
  const total = useSelector(selectContainerThresholdsTotal);
  const totalPages = useSelector(selectContainerThresholdsTotalPages);
  
  // Additional data for form and table display
  const containerTypes = useSelector(selectContainerTypes);
  const portOfLoading = useSelector(selectPortOfLoading);
  const portOfDischarge = useSelector(selectPortOfDischarge);

  console.log({portOfLoading});
  
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

  // Load container thresholds on component mount and when filters change
  useEffect(() => {
    try {
      dispatch(fetchContainerThresholds(filters));
    } catch (error) {
      console.error('Error dispatching fetchContainerThresholds:', error);
    }
  }, [dispatch, filters]);

  // Load additional data for form and table display
  useEffect(() => {
    dispatch(fetchContainerTypes({
      page: 1,
      page_size: 1000,
      order_by: "created_on",
      order_type: "desc"
    }));
    dispatch(fetchPortOfLoading());
    dispatch(fetchPortOfDischarge());
  }, [dispatch]);

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

  // Helper function to get container name by ID
  const getContainerName = (containerId: number) => {
    const container = containerTypes.find(type => type.id === containerId);
    return container ? `${container.code} - ${container.name}` : `ID: ${containerId}`;
  };

  // Helper function to get port name by ID
  const getPortName = (portId: number) => {
    if (Array.isArray(portOfLoading) && portOfLoading.length > 0) {
      // Check if the first item has a 'results' property (POLListResponse structure)
      if (portOfLoading[0] && 'results' in portOfLoading[0]) {
        // It's POLListResponse[] structure
        for (const polResponse of portOfLoading) {
          const port = polResponse.results?.find(p => p.id === portId);
          if (port) return port.name;
        }
      } else {
        // It's directly an array of port objects
        const port = (portOfLoading as any[]).find(p => p.id === portId);
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => (info.table.options.meta as TableMeta<ContainerThresholdResponse>)?.deleteRow(info.row.original.id)}
            className="p-1 text-red-600 hover:text-red-700"
          >
            <TrashBinIcon className="w-4 h-4" />
          </Button>
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
        setDeletingItem(containerThresholds.find(item => item.id === id) || null);
        setDeleteModalOpen(true);
      },
    } as TableMeta<ContainerThresholdResponse>,
  });

  const handleSubmit = async (formData: ContainerThresholdFormData) => {
    try {
      if (editingItem) {
        // Update existing threshold
        await dispatch(updateContainerThreshold({ id: editingItem.id, data: formData }));
        toast.success('Container threshold updated successfully');
      } else {
        // Create new threshold
        await dispatch(createContainerThreshold(formData));
        toast.success('Container threshold created successfully');
      }
      
      closeModal();
    } catch (error) {
      console.error('Error saving container threshold:', error);
      toast.error('Failed to save container threshold');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    
    try {
      await dispatch(deleteContainerThreshold(deletingItem.id));
      toast.success('Container threshold deleted successfully');
      setDeleteModalOpen(false);
      setDeletingItem(null);
    } catch (error) {
      console.error('Error deleting container threshold:', error);
      toast.error('Failed to delete container threshold');
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
          Container Thresholds
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage container capacity thresholds and constraints
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
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
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          Add Threshold
        </Button>
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
              <tr key={row.id}>
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
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={filters.page}
            totalPages={totalPages}
            onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
          />
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
          portOfLoading={getPortDataForForm()}
          portOfDischarge={[]}
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
}

export default withSimpleRBAC(ContainerThresholdPage, {
  route: "/admin/container-thresholds",
  privilege: "VIEW_CONTAINER_THRESHOLDS"
}); 