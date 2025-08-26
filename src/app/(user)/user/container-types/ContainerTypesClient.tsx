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
import { DownloadIcon, PencilIcon, TrashBinIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon } from "@/icons";
import { FormModal } from "@/components/ui/modal/FormModal";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import { useFormModal } from "@/hooks/useFormModal";
import toast from "react-hot-toast";
import { withRouteAuth } from "@/components/auth/withAuth";
import Pagination from "@/components/tables/Pagination";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  fetchContainerTypes,
  createContainerType,
  updateContainerType,
  patchContainerType,
  deleteContainerType,
  exportContainerTypes,
  selectContainerTypes,
  selectContainerTypesLoading,
  selectContainerTypesError,
  selectContainerTypesTotal,
  clearError,
} from "@/store/slices/containerTypeSlice";
import {
  useGetContainerTypesQuery,
  useCreateContainerTypeMutation,
  useUpdateContainerTypeMutation,
  usePatchContainerTypeMutation,
  useDeleteContainerTypeMutation,
} from "@/store/api/apiSlice";
import { ContainerTypeResponse, ContainerTypeListRequest, CreateContainerTypeRequest, UpdateContainerTypeRequest } from "@/types/api";
import { ContainerTypeForm, ContainerTypeFormData } from "@/components/forms/ContainerTypeForm";

const columnHelper = createColumnHelper<ContainerTypeResponse>();

function ContainerTypesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  const dispatch = useDispatch<AppDispatch>();
  
  // Local state for filtering and pagination
  const [filters, setFilters] = useState<ContainerTypeListRequest>({
    page: 1,
    page_size: 10,
    order_by: "created_on",
    order_type: "desc"
  });
  
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ContainerTypeResponse | null>(null);

  // Redux state
  const containerTypes = useSelector(selectContainerTypes);
  const loading = useSelector(selectContainerTypesLoading);
  const error = useSelector(selectContainerTypesError);
  const total = useSelector(selectContainerTypesTotal);

  // RTK Query hooks (alternative approach)
  // const { data: containerTypesRTK, isLoading: loadingRTK, error: errorRTK } = useGetContainerTypesQuery(filters);
  const [createContainerTypeMutation] = useCreateContainerTypeMutation();
  const [updateContainerTypeMutation] = useUpdateContainerTypeMutation();
  const [patchContainerTypeMutation] = usePatchContainerTypeMutation();
  const [deleteContainerTypeMutation] = useDeleteContainerTypeMutation();

  // Load container types on component mount and when filters change
  useEffect(() => {
    dispatch(fetchContainerTypes(filters));
  }, [dispatch, filters]);

  // Sync table sorting with API filters
  useEffect(() => {
    if (sorting.length > 0) {
      const sortConfig = sorting[0];
      setFilters(prev => {
        const newFilters = {
          ...prev,
          order_by: sortConfig.id,
          order_type: sortConfig.desc ? 'desc' : 'asc'
        };
        return newFilters;
      });
    }
  }, [sorting]);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const {
    isOpen: isModalOpen,
    isLoading: isModalLoading,
    editingItem,
    openModal,
    closeModal,
    setLoading: setModalLoading,
  } = useFormModal<ContainerTypeResponse>();

  const columns = useMemo(() => [
    columnHelper.accessor("code", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Container Code
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
          Container Name
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className="text-gray-900 dark:text-white">
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
        <span className="text-gray-600 dark:text-gray-400">
          {info.getValue()}
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
        <span className="text-gray-600 dark:text-gray-400">
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
            onClick={() => openModal(info.row.original)}
            className="p-1"
          >
            <PencilIcon className="w-4 h-4" />
          </Button>
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
        </div>
      ),
    }),
  ], [openModal]);

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
  });

  const handleSubmit = async (formData: ContainerTypeFormData) => {
    try {
      if (editingItem) {
        // Update existing container type
        await dispatch(updateContainerType({ id: editingItem.id, containerTypeData: formData }));
        toast.success('Container type updated successfully');
      } else {
        // Create new container type
        await dispatch(createContainerType(formData));
        toast.success('Container type created successfully');
      }
      
      closeModal();
    } catch (error) {
      console.error('Error saving container type:', error);
      toast.error('Failed to save container type');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    
    try {
      await dispatch(deleteContainerType(deletingItem.id));
      toast.success('Container type deleted successfully');
      setDeleteModalOpen(false);
      setDeletingItem(null);
    } catch (error) {
      console.error('Error deleting container type:', error);
      toast.error('Failed to delete container type');
    }
  };

  const handleExport = async () => {
    try {
      await dispatch(exportContainerTypes({ ...filters, export: true }));
      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Error exporting container types:', error);
      toast.error('Failed to export container types');
    }
  };

  const handleAddNew = () => {
    openModal();
  };

  const filteredData = table.getFilteredRowModel().rows;
  const totalPages = Math.ceil(total / (filters.page_size || 10));

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ChevronUpIcon className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Container Type Management
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage container types with comprehensive CRUD operations
        </p>
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
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <DownloadIcon className="w-4 h-4" />
            Export
          </Button>
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
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={filters.page || 1}
            totalPages={totalPages}
            onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
          />
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
}

export default withRouteAuth(ContainerTypesPage, "user/container-types");