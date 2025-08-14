"use client";

import { withAdminAuth } from "@/components/auth/withAuth";
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
  SortingState,
  TableMeta,
  
} from "@tanstack/react-table";
import Input from "@/components/form/input/InputField";
import { FormModal } from "@/components/ui/modal/FormModal";
import { ContainerTypeForm } from "@/components/forms/ContainerTypeForm";
import { useFormModal } from "@/hooks/useFormModal";
import { PencilIcon, TrashBinIcon } from "@/icons";
import { z } from "zod";

const containerTypeSchema = z.object({
  name: z.string().min(1, "Container name is required"),
  code: z.string().min(1, "Container code is required"),
  description: z.string().optional(),
  capacity: z.number().min(1, "Capacity must be greater than 0"),
  isActive: z.boolean().default(true),
});

type ContainerType = z.infer<typeof containerTypeSchema> & {
  id: string;
  createdAt: string;
};

const columnHelper = createColumnHelper<ContainerType>();


const columns = [
  columnHelper.accessor("name", {
    header: "Container Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("code", {
    header: "Code",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("description", {
    header: "Description",
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.accessor("capacity", {
    header: "Capacity (CBM)",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("isActive", {
    header: "Status",
    cell: (info) => (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          info.getValue()
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        }`}
      >
        {info.getValue() ? "Active" : "Inactive"}
      </span>
    ),
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: (info) => (
      <div className="flex space-x-2">
        <button
          // @ts-expect-error
          onClick={() => (info.table.options.meta as TableMeta<ContainerType>)?.editRow(info.row.original)}
          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          // @ts-expect-error
          onClick={() => (info.table.options.meta as TableMeta<ContainerType>)?.deleteRow(info.row.original.id)}
          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
        >
          <TrashBinIcon className="w-4 h-4" />
        </button>
      </div>
    ),
  }),
];

function ContainerTypesPage() {
  const [data, setData] = useState<ContainerType[]>([
    {
      id: "1",
      name: "40 High Cube",
      code: "40HC",
      description: "40ft High Cube Container",
      capacity: 67.7,
      isActive: true,
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "20 Foot",
      code: "20FT",
      description: "20ft Standard Container",
      capacity: 33.2,
      isActive: true,
      createdAt: "2024-01-15",
    },
    {
      id: "3",
      name: "40 Foot",
      code: "40FT",
      description: "40ft Standard Container",
      capacity: 67.7,
      isActive: false,
      createdAt: "2024-01-15",
    },
    {
      id: "4",
      name: "LCL Container",
      code: "LCL",
      description: "Less than Container Load",
      capacity: 23.2,
      isActive: true,
      createdAt: "2024-01-15",
    }
  ]);

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const {
    isOpen: isModalOpen,
    isLoading: isModalLoading,
    editingItem,
    openModal,
    closeModal,
    setLoading,
  } = useFormModal();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
      meta: {
    editRow: (row: ContainerType) => {
      openModal(row);
    },
    deleteRow: (id: string) => {
      if (confirm("Are you sure you want to delete this container type?")) {
        setData(prev => prev.filter(item => item.id !== id));
        toast.success("Container type deleted successfully");
      }
    },
  } as TableMeta<ContainerType>,
  });

  const handleSubmit = async (formData: ContainerType) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingItem) {
        // Update existing item
        setData(prev => prev.map(item =>
          item.id === (editingItem as ContainerType).id
              ? { ...item, ...formData, id: item.id, createdAt: item.createdAt }
            : item
        ));
        toast.success("Container type updated successfully");
      } else {
        // Add new item
        const newItem: ContainerType = {
          ...formData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        setData(prev => [...prev, newItem]);
        toast.success("Container type added successfully");
      }
      
      closeModal();
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    openModal();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Container Types
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage container configurations and their properties
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search container types..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Button onClick={handleAddNew} size="sm">
          Add New Container Type
        </Button>
      </div>

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

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No container types found. Add your first container type to get started.
        </div>
      )}

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onSubmit={handleSubmit}
        onClose={closeModal}
        title={editingItem ? "Edit Container Type" : "Add New Container Type"}
        isLoading={isModalLoading}
        size="lg"
        showFooter={false}
      >
        <ContainerTypeForm
          initialData={editingItem as ContainerType | undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={isModalLoading}
        />
      </FormModal>
    </div>
  );
}

export default withAdminAuth(ContainerTypesPage); 