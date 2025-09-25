"use client";

import Button from "@/components/ui/button/Button";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import Input from "@/components/form/input/InputField";
import { DownloadIcon, PencilIcon, TrashBinIcon, PlusIcon, ChevronLeftIcon, ChevronUpIcon, ChevronDownIcon } from "@/icons";
import { FormModal } from "@/components/ui/modal/FormModal";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import { useFormModal } from "@/hooks/useFormModal";
import { PortForm, type PortFormData } from "@/components/forms/PortForm";
import toast from "react-hot-toast";
import { withSimplifiedRBAC, SimplifiedRBACProps } from "@/components/auth/withSimplifiedRBAC";
import Pagination from "@/components/tables/Pagination";
import { PODResponse, PODListRequest, CreatePODRequest, UpdatePODRequest } from "@/types/api";
import { podService } from "@/services";

const columnHelper = createColumnHelper<PODResponse>();

interface PodDataManagerProps {
  rbacContext?: SimplifiedRBACProps['rbacContext'];
}

function PodDataManager({ rbacContext }: PodDataManagerProps) {
  // Note: Port data is managed by services, not localStorage
  // useLocalStorageData('ports'); // Removed - ports managed by podService
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  
  // Use RBAC context from withSimplifiedRBAC instead of duplicate hooks
  const { can, isAdmin, isSuperUser } = rbacContext || {};
  
  // Local state for data management
  const [pods, setPods] = useState<PODResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  
  // Local state for filtering and pagination
  const [filters, setFilters] = useState<PODListRequest>({
    page: 1,
    page_size: 10,
    order_by: "created_on",
    order_type: "desc"
  });
  
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<PODResponse | null>(null);

  const {
    isOpen: isModalOpen,
    isLoading: isModalLoading,
    editingItem,
    openModal,
    closeModal,
    setLoading: setModalLoading,
  } = useFormModal<PODResponse>();

  // Check if user can delete POD data using RBAC context
  const canDeletePOD = can?.("DELETE_POD") || isAdmin?.() || isSuperUser;

  // Auto-open modal if action=add
  useEffect(() => {
    if (action === 'add') {
      openModal(undefined);
      // Clear the URL parameter
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('action');
      router.replace(`?${newSearchParams.toString()}`);
    }
  }, [action, openModal, router, searchParams]);

  // Load POD ports on component mount and when filters change
  useEffect(() => {
    loadPODs();
  }, [filters]);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadPODs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await podService.getPODs(filters);
      setPods(response.results || []);
      setTotal(response.count || 0);
    } catch (err: any) {
      console.error('Error loading POD ports:', err);
      setError(err.message || 'Failed to load POD ports');
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor("code", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Port Code
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => <span className="font-mono text-sm font-semibold">{info.getValue()}</span>
    }),
    columnHelper.accessor("name", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Port Name
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor("country", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Country
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => info.getValue() 
    }),
    columnHelper.accessor("city", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          City
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("timezone", { 
      header: "Timezone",
      cell: (info) => (
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("is_active", { 
      header: "Status",
      cell: (info) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          info.getValue() 
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        }`}>
          {info.getValue() ? "Active" : "Inactive"}
        </span>
      )
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
          
          {/* Only show delete button if user has permission */}
          {canDeletePOD && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setDeletingItem(info.row.original);
                setDeleteModalOpen(true);
              }}
              className="p-1 text-red-600 hover:text-red-700"
            >
              <TrashBinIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    }),
  ], [openModal, canDeletePOD]);

  const table = useReactTable<PODResponse>({
    data: pods,
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
  });

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

  const handleSubmit = async (formData: PortFormData) => {
    try {
      setModalLoading(true);
      
      if (editingItem) {
        // Update existing POD port
        const updateData: UpdatePODRequest = {
          name: formData.name,
          code: formData.code,
          country: formData.country,
          city: formData.city,
          timezone: formData.timezone,
          is_active: formData.is_active
        };
        
        await podService.updatePOD(editingItem.id, updateData);
        toast.success('POD port updated successfully');
      } else {
        // Create new POD port
        const createData: CreatePODRequest = {
          name: formData.name,
          code: formData.code,
          country: formData.country,
          city: formData.city,
          timezone: formData.timezone,
          is_active: formData.is_active
        };
        
        await podService.createPOD(createData);
        toast.success('POD port created successfully');
      }
      
      closeModal();
      loadPODs(); // Reload the data
    } catch (error: any) {
      console.error('Error saving POD port:', error);
      toast.error(error.message || 'Failed to save POD port');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    
    // Check permission before allowing delete
    if (!canDeletePOD) {
      toast.error("You don't have permission to delete POD data");
      setDeleteModalOpen(false);
      setDeletingItem(null);
      return;
    }
    
    try {
      setLoading(true);
      await podService.deletePOD(deletingItem.id);
      toast.success('POD port deleted successfully');
      setDeleteModalOpen(false);
      setDeletingItem(null);
      loadPODs(); // Reload the data
    } catch (error: any) {
      console.error('Error deleting POD port:', error);
      toast.error(error.message || 'Failed to delete POD port');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await podService.getPODs({ ...filters, export: true });
      
      // Create CSV content
      const headers = ['Code', 'Name', 'Country', 'City', 'Timezone', 'Status'];
      const csvContent = [
        headers.join(','),
        ...pods.map(pod => [
          pod.code,
          pod.name,
          pod.country,
          pod.city,
          pod.timezone,
          pod.is_active ? 'Active' : 'Inactive'
        ].join(','))
      ].join('\n');

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'pod_ports.csv';
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('POD ports exported successfully');
    } catch (error: any) {
      console.error('Error exporting POD ports:', error);
      toast.error('Failed to export POD ports');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<PODListRequest>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handlePageChange = (page: number) => {
    handleFilterChange({ page });
  };

  const handleSearch = (searchTerm: string) => {
    setGlobalFilter(searchTerm);
    handleFilterChange({ 
      name: searchTerm,
      page: 1 
    });
  };

  if (loading && pods.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading POD ports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">         
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          POD Master
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage Port of Destination (POD) ports and their configurations
        </p>
        
        {/* Permission indicator */}
        {!canDeletePOD && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">
                <strong>Read-only mode:</strong> You can view and edit POD data, but cannot delete records.
              </span>
            </div>
          </div>
        )}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total POD Ports</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{total}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Active Ports</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {pods.filter(p => p.is_active).length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Countries</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {new Set(pods.map(p => p.country)).size}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Cities</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {new Set(pods.map(p => p.city)).size}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search ports by code, name, country, or city..."
            value={globalFilter}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2" disabled={loading}>
            <DownloadIcon className="w-4 h-4" />
            Export
          </Button>
          <Button onClick={() => openModal()} className="flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            Add POD Port
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading POD ports...</p>
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
                    {loading ? 'Loading...' : 'No POD ports found'}
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
              {loading ? 'Loading...' : 'No POD ports found'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {table.getRowModel().rows.map((row) => (
                <div key={row.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="space-y-3">
                    {/* Port Name and Code */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {row.original.port_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {row.original.port_code}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        row.original.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {row.original.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Country and City */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Country:</span>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {row.original.country || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">City:</span>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {row.original.city || 'N/A'}
                        </p>
                      </div>
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
                          onClick={() => handleDelete(row.original.id)}
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
      {total > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700 dark:text-gray-300 order-2 sm:order-1">
            Showing {((filters.page || 1) - 1) * (filters.page_size || 10) + 1} to{" "}
            {Math.min(
              (filters.page || 1) * (filters.page_size || 10),
              total
            )}{" "}
            of {total} results
          </div>
          <div className="order-1 sm:order-2">
            <Pagination
              currentPage={filters.page || 1}
              totalPages={Math.ceil(total / (filters.page_size || 10))}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}

      {total === 0 && !loading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No POD ports found matching your search criteria.
        </div>
      )}

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit POD Port" : "Add New POD Port"}
        size="lg"
        showFooter={false}
      >
        <PortForm
          initialData={editingItem ? {
            id: editingItem.id.toString(),
            name: editingItem.name,
            code: editingItem.code,
            country: editingItem.country,
            city: editingItem.city,
            timezone: editingItem.timezone,
            type: "POD",
            is_active: editingItem.is_active
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={isModalLoading}
          portType="POD"
        />
      </FormModal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete POD Port"
        message={`Are you sure you want to delete the POD port "${deletingItem?.name}"? This action cannot be undone.`}
        isLoading={loading}
      />
    </div>
  );
}

export default withSimplifiedRBAC(PodDataManager, {
  privilege: "VIEW_POD_PORTS",
  module: [60], // Port & Customer Management module
  allowSuperUserBypass: true,
  redirectTo: "/dashboard"
});
