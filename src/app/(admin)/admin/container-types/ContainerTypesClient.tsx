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
import { withSimpleRBAC } from "@/components/auth/withSimpleRBAC";
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
    console.log('🚀 Fetching container types with filters:', filters);
    dispatch(fetchContainerTypes(filters));
  }, [dispatch, filters]);

  // Sync table sorting with API filters
  useEffect(() => {
    if (sorting.length > 0) {
      const sortConfig = sorting[0];
      console.log('🔄 Table sorting changed:', sortConfig);
      setFilters(prev => {
        const newFilters = {
          ...prev,
          order_by: sortConfig.id,
          order_type: sortConfig.desc ? 'desc' : 'asc'
        };
        console.log('📊 Updated filters:', newFilters);
        return newFilters;
      });
    }
    // Don't reset to default sorting automatically - let the initial filters handle it
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

  const columns = useMemo(() => [
    columnHelper.accessor("code", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Container Code
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronUpIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          )}
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
          Container Name
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronUpIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          )}
        </button>
      ),
      cell: (info) => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor("description", { 
      header: "Description",
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("capacity", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Capacity
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronUpIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          )}
        </button>
      ),
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("status", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Status
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronUpIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          )}
        </button>
      ),
      cell: (info) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          info.getValue()
            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
        }`}>
          {info.getValue() ? "Active" : "Inactive"}
        </span>
      ),
    }),
    columnHelper.accessor("created_on", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Created
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronUpIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          )}
        </button>
      ),
      cell: (info) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {info.getValue() ? new Date(info.getValue()!).toLocaleDateString() : "N/A"}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => (
        <div className="flex gap-2">
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
            onClick={() => handleDeleteClick(info.row.original)}
            className="p-1 text-red-600 hover:text-red-700"
          >
            <TrashBinIcon className="w-4 h-4" />
          </Button>
        </div>
      ),
    }),
  ], [openModal]);

  const filteredData = useMemo(() => {
    return containerTypes.filter(item => {
      const matchesSearch =
        item.code.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.description.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.capacity.toLowerCase().includes(globalFilter.toLowerCase());

      return matchesSearch;
    });
  }, [containerTypes, globalFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleAddNew = () => {
    openModal(undefined);
  };

  const handleDeleteClick = (containerType: ContainerTypeResponse) => {
    setDeletingItem(containerType);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    try {
      setModalLoading(true);
      await dispatch(deleteContainerType(deletingItem.id)).unwrap();
      toast.success('Container type deleted successfully');
      setDeleteModalOpen(false);
      setDeletingItem(null);
      
      // Refresh the list
      dispatch(fetchContainerTypes(filters));
    } catch (error: any) {
      console.error('Error deleting container type:', error);
      toast.error(error.message || 'Failed to delete container type');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSubmit = async (formData: ContainerTypeFormData) => {
    try {
      setModalLoading(true);
      
      // Convert form data to API format
      const containerTypeData: CreateContainerTypeRequest | UpdateContainerTypeRequest = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        capacity: formData.capacity,
        status: formData.status,
      };
      
      if (editingItem) {
        // Update existing container type
        await dispatch(updateContainerType({ id: editingItem.id, containerTypeData })).unwrap();
        toast.success('Container type updated successfully');
      } else {
        // Create new container type
        await dispatch(createContainerType(containerTypeData as CreateContainerTypeRequest)).unwrap();
        toast.success('Container type created successfully');
      }
      
      // Refresh the list
      dispatch(fetchContainerTypes(filters));
      closeModal();
    } catch (error: any) {
      console.error('Error saving container type:', error);
      toast.error(error.message || 'Failed to save container type');
    } finally {
      setModalLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const exportData = await dispatch(exportContainerTypes({
        ...filters,
        export: true,
        page_size: 1000
      })).unwrap();
      
      // Create CSV content
      const headers = ['Code', 'Name', 'Description', 'Capacity', 'Status', 'Created On'];
      const csvRows = [
        headers.join(','),
        ...exportData.map(containerType => [
          containerType.code,
          containerType.name,
          containerType.description,
          containerType.capacity,
          containerType.status ? 'Active' : 'Inactive',
          containerType.created_on ? new Date(containerType.created_on).toLocaleDateString() : 'N/A'
        ].join(','))
      ];
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `container_types_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Container types exported successfully');
    } catch (error: any) {
      console.error('Error exporting container types:', error);
      toast.error('Failed to export container types');
    }
  };

  const handleFilterChange = (newFilters: Partial<ContainerTypeListRequest>) => {
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

  if (loading && containerTypes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading container types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">         
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Container Types Master
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage container types and their configurations
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Container Types</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{total}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Active Types</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {containerTypes.filter(c => c.status).length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Unique Codes</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {new Set(containerTypes.map(c => c.code)).size}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">With Description</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {containerTypes.filter(c => c.description).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search container types by code, name, description, or capacity..."
            value={globalFilter}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={handleExport} size="sm" variant="outline">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleAddNew} size="sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Container Type
          </Button>
        </div>
      </div>

      {/* Table */}
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
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
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

      {filteredData.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No container types found matching your search criteria.
        </div>
      )}

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Container Type" : "Add New Container Type"}
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
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingItem(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Container Type"
        message={`Are you sure you want to delete the container type "${deletingItem?.name}" (${deletingItem?.code})? This action cannot be undone.`}
        itemName={deletingItem?.name}
        isLoading={isModalLoading}
        variant="danger"
      />
    </div>
  );
}

export default withSimpleRBAC(ContainerTypesPage, {
  route: "/admin/container-types",
  privilege: "VIEW_CONTAINER_TYPES"
});