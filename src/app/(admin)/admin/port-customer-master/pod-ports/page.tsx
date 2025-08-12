"use client";

import { withRouteAuth } from "@/components/auth/withAuth";
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
  SortingState,
} from "@tanstack/react-table";
import Input from "@/components/form/input/InputField";
import { DownloadIcon, PencilIcon, TrashBinIcon, PlusIcon, ChevronLeftIcon } from "@/icons";
import { FormModal } from "@/components/ui/modal/FormModal";
import { useFormModal } from "@/hooks/useFormModal";
import { PortForm } from "@/components/forms/PortForm";
import toast from "react-hot-toast";
import { dataService, type PODPort } from "@/utils/dataService";

const columnHelper = createColumnHelper<PODPort>();

function PODPortsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  
  // POD Ports data
  const [podPorts, setPodPorts] = useState<PODPort[]>([]);
  

  // Load POD ports from JSON data on component mount
  useEffect(() => {
    loadPODPorts();
  }, []);

  const loadPODPorts = async () => {
    try {
      setLoading(true);
      const data = await dataService.getPODPorts();
      setPodPorts(data);
    } catch (error) {
      console.error('Error loading POD ports:', error);
      toast.error('Failed to load POD ports');
    } finally {
      setLoading(false);
    }
  };

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

  // Auto-open modal if action=add
  useEffect(() => {
    if (action === 'add') {
      openModal(undefined);
    }
  }, [action, openModal]);

  const columns = useMemo(() => [
    columnHelper.accessor("code", { 
      header: "Port Code", 
      cell: (info) => <span className="font-mono text-sm font-semibold">{info.getValue()}</span>
    }),
    columnHelper.accessor("name", { 
      header: "Port Name", 
      cell: (info) => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor("country", { 
      header: "Country", 
      cell: (info) => info.getValue() 
    }),
    columnHelper.accessor("region", { 
      header: "Region", 
      cell: (info) => (
        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("isActive", {
      header: "Status",
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
    columnHelper.accessor("updatedAt", {
      header: "Last Updated",
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
          <button
            onClick={() => openModal(info.row.original)}
            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            title="Edit Port"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(info.row.original.id)}
            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            title="Delete Port"
          >
            <TrashBinIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    }),
  ], [openModal]);

  // Filter data
  const filteredData = useMemo(() => {
    return podPorts.filter(port => {
      const searchTerm = globalFilter.toLowerCase();
      return port.code.toLowerCase().includes(searchTerm) ||
             port.name.toLowerCase().includes(searchTerm) ||
             port.country.toLowerCase().includes(searchTerm) ||
             port.region.toLowerCase().includes(searchTerm);
    });
  }, [podPorts, globalFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  const handleAddNew = () => {
    openModal(undefined);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this POD port?")) {
      setPodPorts(prev => prev.filter(item => item.id !== id));
      toast.success("POD port deleted successfully");
    }
  };

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      if (editingItem) {
        // Update existing port
        setPodPorts(prev => prev.map(item => 
          item.id === editingItem.id ? { 
            ...item, 
            ...formData,
            updatedAt: new Date().toISOString()
          } : item
        ));
        toast.success("POD port updated successfully");
      } else {
        // Add new port
        const newPort: PODPort = {
          id: Date.now().toString(),
          ...formData,
          region: "Europe", // Default region for POD ports
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setPodPorts(prev => [...prev, newPort]);
        toast.success("POD port added successfully");
      }
      
      closeModal();
    } catch (error) {
      toast.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const headers = ["Port Code", "Port Name", "Country", "Region", "Status", "Last Updated"];
    
    const csvContent = [
      headers.join(","),
      ...filteredData.map(port => [
        port.code,
        port.name,
        port.country,
        port.region,
        port.isActive ? "Active" : "Inactive",
        new Date(port.updatedAt).toLocaleDateString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pod_ports_data.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("POD ports data exported successfully");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/port-customer-master")}
            className="flex items-center gap-2"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back to Master
          </Button>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          POD Ports Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage Port of Discharge ports for container shipments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total POD Ports</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{podPorts.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Active Ports</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {podPorts.filter(p => p.isActive).length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Countries</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {new Set(podPorts.map(p => p.country)).size}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Regions</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {new Set(podPorts.map(p => p.region)).size}
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search POD ports..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-4">
          <Button onClick={handleAddNew} size="sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add POD Port
          </Button>
          <Button onClick={exportData} size="sm" variant="outline">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export
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

      {filteredData.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No POD ports found matching your filters.
        </div>
      )}

      {/* Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit POD Port" : "Add New POD Port"}
        size="lg"
      >
        <PortForm
          initialData={editingItem as any}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={isModalLoading}
          portType="POD"
        />
      </FormModal>
    </div>
  );
}

export default withRouteAuth(PODPortsPage, "admin/port-customer-master/pod-ports");
