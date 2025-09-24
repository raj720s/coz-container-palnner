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
  ChevronDownIcon,
  FilterIcon
} from "@/icons";
import { CustomerFilterDropdown } from "./CustomerFilterDropdown";
import { ConfigurationDrawer } from "./ConfigurationDrawer";
import { DynamicField } from "@/utils/customerDynamicFieldsUtils";

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
  const [customerFilter, setCustomerFilter] = useState<number | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  
  // Column configuration
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    so_number: true,
    status: true,
    shipper: true,
    consignee: true,
    transportation_mode: true,
    service_type: true,
    cargo_readiness_date: true,
    volume: true,
    weight: true,
    port_of_loading: true,
    port_of_discharge: true,
    customer_name: true,
    created_at: true,
    updated_at: false,
  });

  // Load shipment orders - Since there's no list endpoint, we'll use mock data for now
  const loadShipmentOrders = async () => {
    try {
      setLoading(true);
      // TODO: Implement a different approach since there's no list endpoint
      // For now, we'll use empty array and let users create individual orders
      setShipmentOrders([]);
      setPagination(prev => ({
        ...prev,
        total: 0,
        totalPages: 0,
        page: 1,
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
  }, []);

  // Handle create/edit
  const handleCreate = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  const handleEdit = (order: ShipmentOrderResponse) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this shipment order?")) {
      try {
        await shipmentOrderService.deleteShipmentOrder(id);
        await loadShipmentOrders();
      } catch (error) {
        console.error("Failed to delete shipment order:", error);
      }
    }
  };

  const handleStatusUpdate = async (id: number, status: ShipmentOrderStatus) => {
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
        await shipmentOrderService.updateShipmentOrder(editingOrder.id, {
          ...data,
          vendor_booking_status: editingOrder.vendor_booking_status, // Preserve existing status
        });
      } else {
        await shipmentOrderService.createShipmentOrder({
          ...data,
          vendor_booking_status: 'draft' as ShipmentOrderStatus, // Default status for new orders
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
    // Export functionality not available - no export endpoint in API
    console.warn("Export functionality not available - no export endpoint in API");
  };

  // Column visibility handlers
  const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnId]: visible
    }));
  };

  // Dynamic field handlers
  const handleDynamicFieldAdd = (field: DynamicField) => {
    setDynamicFields(prev => [...prev, field]);
  };

  const handleDynamicFieldUpdate = (fieldId: string, updates: Partial<DynamicField>) => {
    setDynamicFields(prev => 
      prev.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    );
  };

  const handleDynamicFieldRemove = (fieldId: string) => {
    setDynamicFields(prev => prev.filter(field => field.id !== fieldId));
  };

  // Helper function to categorize columns
  const getColumnCategory = (columnId: string): string => {
    const basicColumns = ['so_number', 'status', 'shipper', 'consignee', 'customer_name'];
    const shippingColumns = ['transportation_mode', 'service_type', 'port_of_loading', 'port_of_discharge'];
    const cargoColumns = ['cargo_type', 'volume', 'weight', 'cargo_readiness_date'];
    const dateColumns = ['created_at', 'updated_at'];
    const statusColumns = ['status'];

    if (basicColumns.includes(columnId)) return 'basic';
    if (shippingColumns.includes(columnId)) return 'shipping';
    if (cargoColumns.includes(columnId)) return 'cargo';
    if (dateColumns.includes(columnId)) return 'dates';
    if (statusColumns.includes(columnId)) return 'status';
    return 'basic';
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = shipmentOrders.length;
    const draft = shipmentOrders.filter(so => so.vendor_booking_status === 'draft').length;
    const confirmed = shipmentOrders.filter(so => so.vendor_booking_status === 'confirmed').length;
    const shipped = shipmentOrders.filter(so => so.vendor_booking_status === 'shipped').length;
    
    return { total, draft, confirmed, shipped };
  }, [shipmentOrders]);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return shipmentOrders.filter((item) => {
      const matchesSearch = !globalFilter || 
        item.vendor_booking_number.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.shipper.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.consignee.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.customer_name?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.place_of_receipt?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.place_of_delivery?.toLowerCase().includes(globalFilter.toLowerCase());

      const matchesStatus = !statusFilter || item.vendor_booking_status === statusFilter;
      const matchesTransportationMode = !transportationModeFilter || item.transportation_mode === transportationModeFilter;
      const matchesServiceType = !serviceTypeFilter || item.service_type === serviceTypeFilter;
      const matchesCargoType = !cargoTypeFilter || item.cargo_type === cargoTypeFilter;

      return matchesSearch && matchesStatus && matchesTransportationMode && matchesServiceType && matchesCargoType;
    });
  }, [shipmentOrders, globalFilter, statusFilter, transportationModeFilter, serviceTypeFilter, cargoTypeFilter]);

  // Table columns
  const columns = useMemo(() => {
    // Base (static) columns
    const baseColumns = [
      columnHelper.accessor("vendor_booking_number", {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Booking Number
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
        ),
      }),
  
      columnHelper.accessor("vendor_booking_status", {
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
          const statusColors: Record<string, string> = {
            draft:
              "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
            confirmed:
              "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
            booked:
              "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
            cancelled:
              "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
            shipped:
              "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
          };
  
          return (
            <span className={`px-2 py-1 text-xs rounded-full ${statusColors[status]}`}>
              {status}
            </span>
          );
        },
      }),
  
      // ... all your other static columns unchanged ...
  
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
  
            {info.row.original.vendor_booking_status === "draft" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleStatusUpdate(info.row.original.id, "confirmed")
                }
                className="p-1 text-blue-600 border-blue-300 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                Confirm
              </Button>
            )}

            {info.row.original.vendor_booking_status === "confirmed" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleStatusUpdate(info.row.original.id, "booked")
                }
                className="p-1 text-purple-600 border-purple-300 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-900/20"
              >
                Book
              </Button>
            )}

            {info.row.original.vendor_booking_status === "booked" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleStatusUpdate(info.row.original.id, "shipped")
                }
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
        ),
      }),
    ];
  
    // ✅ Dynamic columns need to be defined OUTSIDE the baseColumns array
    const dynamicColumns = dynamicFields.map((field) =>
      columnHelper.display({
        id: `dynamic_${field.id}`,
        header: field.label,
        cell: () => (
          <span className="text-sm text-gray-900 dark:text-white">
            {field.value || "-"}
          </span>
        ),
      })
    );
  
    // Combine & filter
    const allColumns = [...baseColumns, ...dynamicColumns];
  
    return allColumns.filter((column) => {
      if (column.id === "actions") return true; // Always show actions
      return columnVisibility[column.id as string] !== false;
    });
  }, [dynamicFields, columnVisibility]);
  

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
    <div className={`space-y-6 transition-all duration-300 ease-in-out ${
      isConfigDrawerOpen ? 'mr-96' : 'mr-0'
    }`}>
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

            {/* Customer Filter */}
            <CustomerFilterDropdown
              selectedCustomerId={customerFilter}
              onCustomerChange={setCustomerFilter}
            />

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ShipmentOrderStatus | "")}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white text-sm min-w-[120px]"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="booked">Booked</option>
              <option value="cancelled">Cancelled</option>
              <option value="shipped">Shipped</option>
            </select>

            {/* Transportation Mode Filter */}
            <select
              value={transportationModeFilter}
              onChange={(e) => setTransportationModeFilter(e.target.value as TransportationMode | "")}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white text-sm min-w-[120px]"
            >
              <option value="">All Modes</option>
              <option value="ocean">Ocean</option>
              <option value="air">Air</option>
              <option value="road">Road</option>
              <option value="rail">Rail</option>
            </select>

            {/* Service Type Filter */}
            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value as ServiceType | "")}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white text-sm min-w-[120px]"
            >
              <option value="">All Services</option>
              <option value="cy">CY (Container Yard)</option>
              <option value="cfs">CFS (Container Freight Station)</option>
            </select>

            {/* Configuration Button */}
            <Button
              onClick={() => setIsConfigDrawerOpen(true)}
              size="sm"
              variant="outline"
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
            >
              <FilterIcon className="w-4 h-4 mr-2" />
              Configure
            </Button>

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
            id: editingOrder.id,
            shipper: editingOrder.shipper,
            consignee: editingOrder.consignee,
            transportation_mode: editingOrder.transportation_mode,
            cargo_readiness_date: editingOrder.cargo_readiness_date,
            service_type: editingOrder.service_type,
            volume: editingOrder.volume,
            weight: editingOrder.weight,
            hs_code: editingOrder.hs_code,
            cargo_description: editingOrder.cargo_description,
            marks_and_numbers: editingOrder.marks_and_numbers,
            cargo_type: editingOrder.cargo_type,
            dangerous_goods_notes: editingOrder.dangerous_goods_notes,
            place_of_receipt: editingOrder.place_of_receipt,
            place_of_delivery: editingOrder.place_of_delivery,
            carrier: editingOrder.carrier,
            carrier_booking_number: editingOrder.carrier_booking_number,
            customer: editingOrder.customer,
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingOrder(null);
          }}
          isLoading={loading}
        />
      </FormModal>

      {/* Configuration Drawer */}
      <ConfigurationDrawer
        isOpen={isConfigDrawerOpen}
        onClose={() => setIsConfigDrawerOpen(false)}
        selectedCustomerId={customerFilter}
        columns={Object.entries(columnVisibility).map(([id, visible]) => ({
          id,
          label: id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          visible,
          category: getColumnCategory(id)
        }))}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        onDynamicFieldAdd={handleDynamicFieldAdd}
        onDynamicFieldUpdate={handleDynamicFieldUpdate}
        onDynamicFieldRemove={handleDynamicFieldRemove}
      />
    </div>
  );
};

export default withSimplifiedRBAC(ShipmentOrderManager);
