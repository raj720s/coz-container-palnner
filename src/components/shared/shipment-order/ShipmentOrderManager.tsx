"use client";
import React, { useEffect, useState, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import { 
  ShipmentOrderResponse, 
  ShipmentOrderListRequest,
  ShipmentOrderFormData,
  ShipmentOrderStatus,
  TransportationMode,
  ServiceType,
  CargoType
} from "@/types/shipmentOrder";
import { shipmentOrderService } from "@/services/shipmentOrderService";
import { ShipmentOrderForm } from "@/components/forms/ShipmentOrderForm";
import { FormModal } from "@/components/ui/modal/FormModal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Pagination from "@/components/tables/Pagination";
import { withSimplifiedRBAC, SimplifiedRBACProps } from "@/components/auth/withSimplifiedRBAC";
import { 
  PlusIcon, 
  PencilIcon, 
  TrashBinIcon, 
  DownloadIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from "@/icons";

const columnHelper = createColumnHelper<ShipmentOrderResponse>();

interface ShipmentOrderManagerProps {
  rbacContext?: SimplifiedRBACProps['rbacContext'];
}

const ShipmentOrderManager: React.FC<ShipmentOrderManagerProps> = ({ rbacContext }) => {
  const [shipmentOrders, setShipmentOrders] = useState<ShipmentOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ShipmentOrderResponse | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShipmentOrderStatus | "">("");
  const [transportationModeFilter, setTransportationModeFilter] = useState<TransportationMode | "">("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceType | "">("");
  const [cargoTypeFilter, setCargoTypeFilter] = useState<CargoType | "">("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Load shipment orders
  const loadShipmentOrders = async (params: ShipmentOrderListRequest = {}) => {
    try {
      setLoading(true);
      const response = await shipmentOrderService.getShipmentOrders({
        page: pagination.page,
        limit: pagination.limit,
        search: globalFilter || undefined,
        status: statusFilter || undefined,
        transportation_mode: transportationModeFilter || undefined,
        service_type: serviceTypeFilter || undefined,
        cargo_type: cargoTypeFilter || undefined,
        ...params,
      });
      
      setShipmentOrders(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        totalPages: response.total_pages,
        page: response.page,
      }));
    } catch (error) {
      console.error("Failed to load shipment orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadShipmentOrders();
  }, [pagination.page, pagination.limit]);

  // Filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadShipmentOrders({ page: 1 });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [globalFilter, statusFilter, transportationModeFilter, serviceTypeFilter, cargoTypeFilter]);

  // Handle create/edit
  const handleCreate = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  const handleEdit = (order: ShipmentOrderResponse) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this shipment order?")) {
      try {
        await shipmentOrderService.deleteShipmentOrder(id);
        await loadShipmentOrders();
      } catch (error) {
        console.error("Failed to delete shipment order:", error);
      }
    }
  };

  const handleStatusUpdate = async (id: string, status: ShipmentOrderStatus) => {
    try {
      await shipmentOrderService.updateShipmentOrderStatus(id, status);
      await loadShipmentOrders();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleSubmit = async (data: ShipmentOrderFormData) => {
    try {
      if (editingOrder) {
        await shipmentOrderService.updateShipmentOrder({
          id: editingOrder.id,
          ...data,
          status: editingOrder.status, // Preserve existing status
        });
      } else {
        await shipmentOrderService.createShipmentOrder({
          ...data,
          status: 'Draft' as ShipmentOrderStatus, // Default status for new orders
        });
      }
      setIsModalOpen(false);
      setEditingOrder(null);
      await loadShipmentOrders();
    } catch (error) {
      console.error("Failed to save shipment order:", error);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await shipmentOrderService.exportShipmentOrders({
        search: globalFilter || undefined,
        status: statusFilter || undefined,
        transportation_mode: transportationModeFilter || undefined,
        service_type: serviceTypeFilter || undefined,
        cargo_type: cargoTypeFilter || undefined,
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shipment-orders-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export shipment orders:", error);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = shipmentOrders.length;
    const draft = shipmentOrders.filter(so => so.status === 'Draft').length;
    const confirmed = shipmentOrders.filter(so => so.status === 'Confirmed').length;
    const shipped = shipmentOrders.filter(so => so.status === 'Shipped').length;
    
    return { total, draft, confirmed, shipped };
  }, [shipmentOrders]);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return shipmentOrders.filter((item) => {
      const matchesSearch = !globalFilter || 
        item.so_number.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.shipper.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.consignee.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.customer_name?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.port_of_loading.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.port_of_discharge.toLowerCase().includes(globalFilter.toLowerCase());

      const matchesStatus = !statusFilter || item.status === statusFilter;
      const matchesTransportationMode = !transportationModeFilter || item.transportation_mode === transportationModeFilter;
      const matchesServiceType = !serviceTypeFilter || item.service_type === serviceTypeFilter;
      const matchesCargoType = !cargoTypeFilter || item.cargo_type === cargoTypeFilter;

      return matchesSearch && matchesStatus && matchesTransportationMode && matchesServiceType && matchesCargoType;
    });
  }, [shipmentOrders, globalFilter, statusFilter, transportationModeFilter, serviceTypeFilter, cargoTypeFilter]);

  // Table columns
  const columns = useMemo(() => [
    columnHelper.accessor("so_number", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          SO Number
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
        <span className="font-mono text-sm text-theme-purple-600 dark:text-theme-purple-400">
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
      cell: (info) => {
        const status = info.getValue();
        const statusColors = {
          'Draft': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
          'Confirmed': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
          'Shipped': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        };
        
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[status]}`}>
            {status}
          </span>
        );
      }
    }),
    columnHelper.accessor("shipper", {
      header: "Shipper",
      cell: (info) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("consignee", {
      header: "Consignee",
      cell: (info) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("transportation_mode", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Mode
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
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("service_type", {
      header: "Service Type",
      cell: (info) => (
        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-full">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("cargo_readiness_date", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Cargo Date
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
      )
    }),
    columnHelper.accessor("volume", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Volume
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
        <span className="text-sm text-gray-900 dark:text-white">
          {info.getValue().toLocaleString()}
        </span>
      )
    }),
    columnHelper.accessor("weight", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Weight
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
        <span className="text-sm text-gray-900 dark:text-white">
          {info.getValue().toLocaleString()}
        </span>
      )
    }),
    columnHelper.accessor("customer_name", {
      header: "Customer",
      cell: (info) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {info.getValue() || 'N/A'}
        </span>
      )
    }),
    columnHelper.accessor("created_at", {
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
      )
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(info.row.original)}
            className="p-1"
          >
            <PencilIcon className="w-4 h-4" />
          </Button>
          
          {info.row.original.status === 'Draft' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusUpdate(info.row.original.id, 'Confirmed')}
              className="p-1 text-blue-600 border-blue-300 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              Confirm
            </Button>
          )}
          
          {info.row.original.status === 'Confirmed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusUpdate(info.row.original.id, 'Shipped')}
              className="p-1 text-green-600 border-green-300 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20"
            >
              Ship
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(info.row.original.id)}
            className="p-1 text-red-600 border-red-300 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <TrashBinIcon className="w-4 h-4" />
          </Button>
        </div>
      )
    }),
  ], []);

  // Table setup
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-theme-purple-100 dark:bg-theme-purple-900/20 rounded-lg">
              <div className="w-6 h-6 bg-theme-purple-600 dark:bg-theme-purple-400 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="w-6 h-6 bg-gray-600 dark:bg-gray-400 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Draft</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.draft}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <div className="w-6 h-6 bg-blue-600 dark:bg-blue-400 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Confirmed</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.confirmed}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <div className="w-6 h-6 bg-green-600 dark:bg-green-400 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Shipped</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.shipped}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <Input
                placeholder="Search shipment orders..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full focus:ring-theme-purple-500 focus:border-theme-purple-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ShipmentOrderStatus | "")}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white text-sm min-w-[120px]"
            >
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Shipped">Shipped</option>
            </select>

            {/* Transportation Mode Filter */}
            <select
              value={transportationModeFilter}
              onChange={(e) => setTransportationModeFilter(e.target.value as TransportationMode | "")}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white text-sm min-w-[120px]"
            >
              <option value="">All Modes</option>
              <option value="FCL">FCL</option>
              <option value="LCL">LCL</option>
            </select>

            {/* Service Type Filter */}
            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value as ServiceType | "")}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white text-sm min-w-[120px]"
            >
              <option value="">All Services</option>
              <option value="CFS">CFS</option>
              <option value="CY">CY</option>
            </select>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              size="sm"
              variant="outline"
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export
            </Button>

            {/* Add Button */}
            <Button
              onClick={handleCreate}
              size="sm"
              className="bg-theme-purple-600 hover:bg-theme-purple-700 text-white px-4 py-2 whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Order
            </Button>
          </div>
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
      {filteredData.length > 0 && (
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
            onPageChange={(page: number) => table.setPageIndex(page - 1)}
          />
        </div>
      )}

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingOrder(null);
        }}
        title={editingOrder ? "Edit Shipment Order" : "Create Shipment Order"}
        size="xl"
      >
        <ShipmentOrderForm
          initialData={editingOrder ? {
            ...editingOrder,
            id: editingOrder.id,
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingOrder(null);
          }}
          isLoading={loading}
        />
      </FormModal>
    </div>
  );
};

export default withSimplifiedRBAC(ShipmentOrderManager);
