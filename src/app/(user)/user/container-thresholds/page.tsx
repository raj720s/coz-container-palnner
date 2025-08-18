"use client";

import { withUserAuth } from "@/components/auth/withAuth";
import Button from "@/components/ui/button/Button";
import toast from "react-hot-toast";
import React, { useState } from "react";
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
import { FormModal } from "@/components/ui/modal/FormModal";
import { ContainerThresholdForm, ContainerThresholdFormData } from "@/components/forms/ContainerThresholdForm";
import { useFormModal } from "@/hooks/useFormModal";
import { PencilIcon, TrashBinIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon } from "@/icons";
import Pagination from "@/components/tables/Pagination";

type ContainerThreshold = {
  id: string;
  containerType: string;
  minCBM: number;
  maxCBM: number;
  pol: string;
  isDefault: boolean;
  isActive: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
};

interface TableMeta {
  editRow: (row: ContainerThreshold) => void;
  deleteRow: (id: string) => Promise<void>;
}

const columnHelper = createColumnHelper<ContainerThreshold>();

// Mock data for container thresholds
const mockThresholds: ContainerThreshold[] = [
  {
    id: "1",
    containerType: "40HC",
    minCBM: 54.8,
    maxCBM: 62,
    pol: "Yantian",
    isDefault: false,
    isActive: true,
    description: "40HC threshold for Yantian port - optimized for high density cargo",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    containerType: "40HC",
    minCBM: 54,
    maxCBM: 60,
    pol: "Qingdao",
    isDefault: false,
    isActive: true,
    description: "40HC threshold for Qingdao port - standard configuration",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "3",
    containerType: "40HC",
    minCBM: 55,
    maxCBM: 65,
    pol: "",
    isDefault: true,
    isActive: true,
    description: "Default 40HC threshold - applies to all POLs unless overridden",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "4",
    containerType: "40FT",
    minCBM: 44.8,
    maxCBM: 54.8,
    pol: "Yantian",
    isDefault: false,
    isActive: true,
    description: "40FT threshold for Yantian port - optimized for high density cargo",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "5",
    containerType: "40FT",
    minCBM: 43,
    maxCBM: 54,
    pol: "Qingdao",
    isDefault: false,
    isActive: true,
    description: "40FT threshold for Qingdao port - standard configuration",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "6",
    containerType: "40FT",
    minCBM: 45,
    maxCBM: 55,
    pol: "",
    isDefault: true,
    isActive: true,
    description: "Default 40FT threshold - applies to all POLs unless overridden",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "7",
    containerType: "20GP",
    minCBM: 19.9,
    maxCBM: 23,
    pol: "Yantian",
    isDefault: false,
    isActive: true,
    description: "20GP threshold for Yantian port - optimized for high density cargo",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "8",
    containerType: "20GP",
    minCBM: 19.9,
    maxCBM: 23,
    pol: "Qingdao",
    isDefault: false,
    isActive: true,
    description: "20GP threshold for Qingdao port - standard configuration",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "9",
    containerType: "20GP",
    minCBM: 20,
    maxCBM: 25,
    pol: "",
    isDefault: true,
    isActive: true,
    description: "Default 20GP threshold - applies to all POLs unless overridden",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z"
  }
];

const columns = [
  columnHelper.accessor("containerType", {
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        Container Type
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
      <span className="font-medium text-gray-900 dark:text-white">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("pol", {
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        POL
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
        {info.getValue() || "Default (All POLs)"}
      </span>
    ),
  }),
  columnHelper.accessor("minCBM", {
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        Min CBM
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
      <span className="font-mono text-sm">
        {info.getValue().toFixed(1)}
      </span>
    ),
  }),
  columnHelper.accessor("maxCBM", {
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        Max CBM
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
      <span className="font-mono text-sm">
        {info.getValue().toFixed(1)}
      </span>
    ),
  }),
  columnHelper.accessor("isDefault", {
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        Default
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
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          info.getValue()
            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
        }`}
      >
        {info.getValue() ? "Default" : "Override"}
      </span>
    ),
  }),
  columnHelper.accessor("isActive", {
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
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          info.getValue()
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-red-100 text-red-800 dark:bg-green-900 dark:text-red-200"
        }`}
      >
        {info.getValue() ? "Active" : "Inactive"}
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
        {new Date(info.getValue()).toLocaleDateString()}
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
          onClick={() => (info.table.options.meta as TableMeta)?.editRow(info.row.original)}
          className="p-1"
        >
          <PencilIcon className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => (info.table.options.meta as TableMeta)?.deleteRow(info.row.original.id)}
          className="p-1 text-red-600 hover:text-red-700"
        >
          <TrashBinIcon className="w-4 h-4" />
        </Button>
      </div>
    ),
  }),
];

function ContainerThresholdsPage() {
  const [data, setData] = useState<ContainerThreshold[]>(mockThresholds);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const {
    isOpen: isModalOpen,
    isLoading: isModalLoading,
    editingItem,
    openModal,
    closeModal,
    setLoading,
  } = useFormModal<ContainerThreshold>();

  const table = useReactTable({
    data,
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
      editRow: (row: ContainerThreshold) => {
        openModal(row);
      },
      deleteRow: async (id: string) => {
        if (confirm("Are you sure you want to delete this threshold?")) {
          try {
            const updatedData = data.filter(item => item.id !== id);
            setData(updatedData);
            toast.success("Threshold deleted successfully");
          } catch (error) {
            console.error('Delete error:', error);
            toast.error('Delete failed');
          }
        }
      },
    } as TableMeta,
  });

  const handleSubmit = async (formData: ContainerThresholdFormData) => {
    setLoading(true);
    
    try {
      if (editingItem) {
        // Update existing item
        const updatedData = data.map(item => 
          item.id === (editingItem as ContainerThreshold).id 
            ? { ...item, ...formData, updatedAt: new Date().toISOString() }
            : item
        );
        setData(updatedData);
        toast.success("Threshold updated successfully");
      } else {
        // Add new item
        const newThreshold: ContainerThreshold = {
          ...formData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setData([...data, newThreshold]);
        toast.success("Threshold added successfully");
      }
      
      closeModal();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
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
          Threshold Configuration
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage minimum and maximum CBM values for each container type
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search thresholds by container type, POL, or description..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Button onClick={handleAddNew} size="sm">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add New Threshold
        </Button>
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
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
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

      {filteredData.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No thresholds found matching your search criteria.
        </div>
      )}

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onSubmit={handleSubmit}
        onClose={closeModal}
        title={editingItem ? "Edit Threshold" : "Add New Threshold"}
        isLoading={isModalLoading}
        size="lg"
        showFooter={false}
      >
        <ContainerThresholdForm
          initialData={editingItem ? {
            containerType: editingItem.containerType,
            minCBM: editingItem.minCBM,
            maxCBM: editingItem.maxCBM,
            pol: editingItem.pol || "",
            isDefault: editingItem.isDefault,
            isActive: editingItem.isActive,
            description: editingItem.description
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={isModalLoading}
        />
      </FormModal>
    </div>
  );
}

export default withUserAuth(ContainerThresholdsPage);
