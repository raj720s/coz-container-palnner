"use client";

import { withRouteAuth } from "@/components/auth/withAuth";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { FormModal } from "@/components/ui/modal/FormModal";
import { useFormModal } from "@/hooks/useFormModal";
import { PencilIcon, TrashBinIcon, PlusIcon, HorizontaLDots, ChevronUpIcon, ChevronDownIcon } from "@/icons";
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Pagination from "@/components/tables/Pagination";

interface ContainerPriority {
  id: string;
  containerType: string;
  priority: number;
  status: "active" | "inactive";
  description: string;
  specifications: {
    length: number;
    width: number;
    height: number;
    maxCBM: number;
    maxWeight: number;
    groupMixRules?: {
      maxDestinations: number;
      minCBMPerDestination: number;
      allowedDestinationTypes: string[];
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface ContainerPriorityFormData {
  containerType: string;
  priority: number;
  status: "active" | "inactive";
  description: string;
  specifications: {
    length: number;
    width: number;
    height: number;
    maxCBM: number;
    maxWeight: number;
    groupMixRules?: {
      maxDestinations: number;
      minCBMPerDestination: number;
      allowedDestinationTypes: string[];
    };
  };
}

interface TableMeta<T> {
  editRow: (row: T) => void;
  deleteRow: (id: string) => Promise<void>;
}

const columnHelper = createColumnHelper<ContainerPriority>();

// Mock data for container priorities
const mockPriorities: ContainerPriority[] = [
  {
    id: "1",
    containerType: "40HQ",
    priority: 1,
    status: "active",
    description: "Highest priority container type for premium shipments",
    specifications: {
      length: 40,
      width: 8,
      height: 9.5,
      maxCBM: 67.7,
      maxWeight: 28000,
    },
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    containerType: "40GP",
    priority: 2,
    status: "active",
    description: "Standard 40ft container for general cargo",
    specifications: {
      length: 40,
      width: 8,
      height: 8.5,
      maxCBM: 67.7,
      maxWeight: 28000,
    },
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "3",
    containerType: "20GP",
    priority: 3,
    status: "active",
    description: "20ft container for smaller shipments",
    specifications: {
      length: 20,
      width: 8,
      height: 8.5,
      maxCBM: 33.2,
      maxWeight: 28000,
    },
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z"
  }
];

const columns = [
  columnHelper.display({
    id: "dragHandle",
    header: "",
    cell: () => (
      <div className="flex items-center justify-center w-6 h-6 cursor-grab active:cursor-grabbing">
        <HorizontaLDots className="w-4 h-4 text-gray-400" />
      </div>
    ),
  }),
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
  columnHelper.accessor("priority", {
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        Priority
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
      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
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
          info.getValue() === 'active'
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        }`}
      >
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("specifications.maxCBM", {
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
  columnHelper.accessor("specifications.maxWeight", {
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        Max Weight
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
        {info.getValue()} kg
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
      <span className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
        {info.getValue()}
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
          onClick={() => (info.table.options.meta as TableMeta<ContainerPriority>)?.editRow(info.row.original)}
          className="p-1"
        >
          <PencilIcon className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => (info.table.options.meta as TableMeta<ContainerPriority>)?.deleteRow(info.row.original.id)}
          className="p-1 text-red-600 hover:text-red-700"
        >
          <TrashBinIcon className="w-4 h-4" />
        </Button>
      </div>
    ),
  }),
];

// Sortable row component
function SortableRow({ 
  children, 
  id, 
  ...props 
}: { 
  children: React.ReactNode; 
  id: string; 
  [key: string]: string | number | boolean | React.ReactNode | undefined;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} {...props}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div {...attributes} {...listeners}>
          <HorizontaLDots className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
        </div>
      </td>
      {children}
    </tr>
  );
}

function ContainerPriorityPage() {
  const [data, setData] = useState<ContainerPriority[]>(mockPriorities);
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const table = useReactTable<ContainerPriority>({
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
      editRow: (row: ContainerPriority) => {
        openModal(row);
      },
      deleteRow: async (id: string) => {
        if (confirm("Are you sure you want to delete this container priority?")) {
          try {
            const updatedData = data.filter(item => item.id !== id);
            setData(updatedData);
            toast.success("Container priority deleted successfully");
          } catch (error) {
            console.error('Delete error:', error);
            toast.error('Delete failed');
          }
        }
      },
    } as TableMeta<ContainerPriority>,
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setData((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update priority numbers based on new order
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          priority: index + 1,
          updatedAt: new Date().toISOString(),
        }));

        return updatedItems;
      });
      
      toast.success("Priority order updated successfully");
    }
  };

  const handleSubmit = async (formData: ContainerPriorityFormData) => {
    try {
      setLoading(true);
      
      if (editingItem) {
        // Update existing priority
        const updatedData = data.map(item => 
          item.id === (editingItem as ContainerPriority).id 
            ? { ...item, ...formData, updatedAt: new Date().toISOString() }
            : item
        );
        setData(updatedData);
        toast.success('Container priority updated successfully');
      } else {
        // Create new priority
        const newPriority: ContainerPriority = {
          id: Date.now().toString(),
          ...formData,
          priority: data.length + 1, // Add to end of list
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setData([...data, newPriority]);
        toast.success('Container priority created successfully');
      }
      
      closeModal();
    } catch (error) {
      console.error('Error saving container priority:', error);
      toast.error('Failed to save container priority');
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
          Priority Configuration
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage container priorities with drag-and-drop reordering
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search priorities by container type or description..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Button onClick={handleAddNew} size="sm">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add New Priority
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
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
                <SortableContext
                  items={table.getRowModel().rows.map(row => row.original.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    <SortableRow key={row.id} id={row.original.id}>
                      {row.getVisibleCells().slice(1).map((cell) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </SortableRow>
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
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
          No priorities found matching your search criteria.
        </div>
      )}

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onSubmit={handleSubmit}
        onClose={closeModal}
        title={editingItem ? "Edit Container Priority" : "Add New Container Priority"}
        isLoading={isModalLoading}
        size="lg"
        showFooter={false}
      >
        <ContainerPriorityForm
          initialData={editingItem as ContainerPriority | undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={isModalLoading}
        />
      </FormModal>
    </div>
  );
}

function ContainerPriorityForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: {
  initialData?: ContainerPriority;
  onSubmit: (data: ContainerPriorityFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<ContainerPriorityFormData>({
    containerType: "",
    priority: 1,
    status: "active",
    description: "",
    specifications: {
      length: 0,
      width: 0,
      height: 0,
      maxCBM: 0,
      maxWeight: 0,
    },
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        containerType: initialData.containerType,
        priority: initialData.priority,
        status: initialData.status,
        description: initialData.description,
        specifications: { ...initialData.specifications },
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const containerTypes = [
    "20GP", "40GP", "40HC", "40FT", "40HQ", "LCL",
    "20GP_GroupMix", "40GP_GroupMix", "40HC_GroupMix", "40FT_GroupMix", "40HQ_GroupMix"
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Container Type *
          </label>
          <select
            value={formData.containerType}
            onChange={(e) => setFormData({ ...formData, containerType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            required
          >
            <option value="">Select Container Type</option>
            {containerTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Priority *
          </label>
          <Input
            type="number"
            min="1"
            max="10"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Max CBM *
          </label>
          <Input
            type="number"
            step="0.1"
            min="0"
            value={formData.specifications.maxCBM}
            onChange={(e) => setFormData({
              ...formData,
              specifications: {
                ...formData.specifications,
                maxCBM: parseFloat(e.target.value) || 0
              }
            })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Length (ft)
          </label>
          <Input
            type="number"
            min="0"
            value={formData.specifications.length}
            onChange={(e) => setFormData({
              ...formData,
              specifications: {
                ...formData.specifications,
                length: parseFloat(e.target.value) || 0
              }
            })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Width (ft)
          </label>
          <Input
            type="number"
            min="0"
            value={formData.specifications.width}
            onChange={(e) => setFormData({
              ...formData,
              specifications: {
                ...formData.specifications,
                width: parseFloat(e.target.value) || 0
              }
            })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Height (ft)
          </label>
          <Input
            type="number"
            min="0"
            value={formData.specifications.height}
            onChange={(e) => setFormData({
              ...formData,
              specifications: {
                ...formData.specifications,
                height: parseFloat(e.target.value) || 0
              }
            })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Max Weight (kg) *
        </label>
        <Input
          type="number"
          min="0"
          value={formData.specifications.maxWeight}
          onChange={(e) => setFormData({
            ...formData,
            specifications: {
              ...formData.specifications,
              maxWeight: parseFloat(e.target.value) || 0
            }
          })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          rows={3}
          placeholder="Enter description for this container priority..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={isLoading}>
          {isLoading ? "Saving..." : (initialData ? "Update Priority" : "Create Priority")}
        </Button>
      </div>
    </form>
  );
}

export default withRouteAuth(ContainerPriorityPage, "admin/container-priority");
