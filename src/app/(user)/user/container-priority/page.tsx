"use client";

import { withUserAuth } from "@/components/auth/withAuth";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { FormModal } from "@/components/ui/modal/FormModal";
import { useFormModal } from "@/hooks/useFormModal";
import { PencilIcon, TrashBinIcon, PlusIcon, HorizontaLDots } from "@/icons";
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
  columnHelper.accessor("priority", {
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        Priority
        <span className="text-xs">
          {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
        </span>
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
        <span className="text-xs">
          {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
        </span>
      </button>
    ),
    cell: (info) => (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          info.getValue() === 'active'
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-red-100 text-red-800 dark:bg-green-900 dark:text-red-200"
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
        <span className="text-xs">
          {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
        </span>
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
        <span className="text-xs">
          {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
        </span>
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
function SortableRow({ children, id }: { children: React.ReactNode; id: string }) {
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
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
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
  } = useFormModal<ContainerPriority>();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      editRow: (row: ContainerPriority) => {
        openModal(row);
      },
      deleteRow: async (id: string) => {
        if (confirm("Are you sure you want to delete this priority?")) {
          try {
            const updatedData = data.filter(item => item.id !== id);
            setData(updatedData);
            toast.success("Priority deleted successfully");
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
        
        // Update priorities based on new order
        return newItems.map((item, index) => ({
          ...item,
          priority: index + 1,
          updatedAt: new Date().toISOString()
        }));
      });
      
      toast.success("Priority order updated successfully");
    }
  };

  const handleSubmit = async (formData: ContainerPriorityFormData) => {
    setLoading(true);
    
    try {
      if (editingItem) {
        // Update existing item
        const updatedData = data.map(item => 
          item.id === (editingItem as ContainerPriority).id 
            ? { ...item, ...formData, updatedAt: new Date().toISOString() }
            : item
        );
        setData(updatedData);
        toast.success("Priority updated successfully");
      } else {
        // Add new item
        const newPriority: ContainerPriority = {
          ...formData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setData([...data, newPriority]);
        toast.success("Priority added successfully");
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
          Container Priority Configuration
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage container priorities and their specifications. Drag and drop to reorder priorities.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search priorities by container type, description, or status..."
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
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
                <SortableContext items={data.map(item => item.id)} strategy={verticalListSortingStrategy}>
                  {table.getRowModel().rows.map((row) => (
                    <SortableRow key={row.id} id={row.original.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </SortableRow>
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </div>
        </div>
      </DndContext>

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
        title={editingItem ? "Edit Priority" : "Add New Priority"}
        isLoading={isModalLoading}
        size="lg"
        showFooter={false}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Container Type
              </label>
              <Input
                placeholder="e.g., 40HQ, 20GP"
                value={editingItem?.containerType || ""}
                onChange={(e) => {
                  // Handle container type change
                }}
                disabled={isModalLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <Input
                type="number"
                placeholder="Priority number"
                value={editingItem?.priority || ""}
                onChange={(e) => {
                  // Handle priority change
                }}
                disabled={isModalLoading}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <Input
              placeholder="Description of the priority configuration"
              value={editingItem?.description || ""}
              onChange={(e) => {
                // Handle description change
              }}
              disabled={isModalLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max CBM
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="Maximum CBM"
                value={editingItem?.specifications.maxCBM || ""}
                onChange={(e) => {
                  // Handle max CBM change
                }}
                disabled={isModalLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Weight (kg)
              </label>
              <Input
                type="number"
                placeholder="Maximum weight in kg"
                value={editingItem?.specifications.maxWeight || ""}
                onChange={(e) => {
                  // Handle max weight change
                }}
                disabled={isModalLoading}
              />
            </div>
          </div>

                     <div className="flex items-center justify-end space-x-3 pt-4">
             <Button
               variant="outline"
               onClick={closeModal}
               disabled={isModalLoading}
             >
               Cancel
             </Button>
             <Button
               disabled={isModalLoading}
             >
               {isModalLoading ? "Saving..." : editingItem ? "Update Priority" : "Add Priority"}
             </Button>
           </div>
        </div>
      </FormModal>
    </div>
  );
}

export default withUserAuth(ContainerPriorityPage);
