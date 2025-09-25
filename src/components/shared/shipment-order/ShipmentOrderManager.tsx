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
  CargoType,
  ShipmentListRequest,
  ShipmentListResponse,
  ShipmentListApiResponse
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

const columnHelper = createColumnHelper<ShipmentListResponse>();

interface ShipmentOrderManagerProps {
  rbacContext?: SimplifiedRBACProps['rbacContext'];
}

const ShipmentOrderManager: React.FC<ShipmentOrderManagerProps> = ({ rbacContext }) => {
  const [shipmentOrders, setShipmentOrders] = useState<ShipmentListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ShipmentListResponse | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShipmentOrderStatus | "">("");
  const [transportationModeFilter, setTransportationModeFilter] = useState<TransportationMode | "">("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceType | "">("");
  const [cargoTypeFilter, setCargoTypeFilter] = useState<CargoType | "">("");
  const [customerFilter, setCustomerFilter] = useState<number | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    page: 0, // API uses 0-based pagination
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [apiFilters, setApiFilters] = useState<Partial<ShipmentListRequest>>({});
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Column configuration based on validation requirements
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    // Mandatory fields (cannot be hidden)
    vendor_booking_number: true,
    vendor_booking_status: true,
    shipper: true,
    consignee: true,
    transportation_mode: true,
    cargo_readiness_date: true,
    service_type: true,
    volume: true,
    weight: true,
    port_of_loading: true,
    port_of_discharge: true,
    customer: true,
    vendor: true,
    origin_partner: true,
    
    // Optional fields (can be hidden)
    hs_code: true,
    cargo_description: true,
    marks_and_numbers: true,
    customer_reference: true,
    cargo_type: false, // Hidden by default as per requirements
    dangerous_goods_notes: true,
    place_of_receipt: true,
    place_of_delivery: true,
    carrier: true,
    carrier_booking_number: true,
    
    // Equipment fields (required for 'Shipped' status)
    equipment_count: true,
    equipment_size_type: true,
    equipment_numbers: true,
    
    // System fields
    created_on: true,
    modified_on: false,
  });

  // Load shipment orders from API
  const loadShipmentOrders = async () => {
    try {
      setLoading(true);
      
      // Build API request
      const request: ShipmentListRequest = {
        page: pagination.page,
        page_size: pagination.pageSize,
        order_by: sorting.length > 0 ? sorting[0].id : undefined,
        order_type: sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
        ...apiFilters,
        // Apply local filters to API request
        vendor_booking_status: statusFilter || undefined,
        transportation_mode: transportationModeFilter || undefined,
        service_type: serviceTypeFilter || undefined,
        cargo_type: cargoTypeFilter || undefined,
        customer: customerFilter || undefined,
        // Global search across multiple fields
        ...(globalFilter && {
          shipper: globalFilter,
          consignee: globalFilter,
          vendor_booking_number: globalFilter,
        }),
      };

      const response = await shipmentOrderService.listShipmentOrders(request);
      
      setShipmentOrders(response.results);
      setPagination(prev => ({
        ...prev,
        total: response.count,
        totalPages: Math.ceil(response.count / pagination.pageSize),
      }));
    } catch (error) {
      console.error("Failed to load shipment orders:", error);
      setShipmentOrders([]);
      setPagination(prev => ({
        ...prev,
        total: 0,
        totalPages: 0,
      }));
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadShipmentOrders();
  }, []);

  // Debounced search function
  const handleGlobalFilterChange = (value: string) => {
    setGlobalFilter(value);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
    }, 500);
    
    setSearchTimeout(timeout);
  };

  // Reload when pagination, sorting, or filters change
  useEffect(() => {
    loadShipmentOrders();
  }, [pagination.page, pagination.pageSize, sorting, statusFilter, transportationModeFilter, serviceTypeFilter, cargoTypeFilter, customerFilter, globalFilter, apiFilters]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Clear all filters
  const clearAllFilters = () => {
    setGlobalFilter("");
    setStatusFilter("");
    setTransportationModeFilter("");
    setServiceTypeFilter("");
    setCargoTypeFilter("");
    setCustomerFilter(null);
    setApiFilters({});
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  // Handle create/edit
  const handleCreate = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  const handleEdit = (order: ShipmentListResponse) => {
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
    console.log("ShipmentOrderManager handleSubmit called with data:", data);
    try {
      if (editingOrder) {
        console.log("Updating shipment order:", editingOrder.id);
        await shipmentOrderService.updateShipmentOrder(editingOrder.id, {
          ...data,
          vendor_booking_status: editingOrder.vendor_booking_status, // Preserve existing status
        });
      } else {
        console.log("Creating new shipment order");
        await shipmentOrderService.createShipmentOrder({
          ...data,
          vendor_booking_status: 'draft' as ShipmentOrderStatus, // Default status for new orders
        });
      }
      console.log("Shipment order saved successfully");
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

  // Helper function to categorize columns based on validation requirements
  const getColumnCategory = (columnId: string): string => {
    // Mandatory fields (including equipment fields)
    const mandatoryColumns = [
      'vendor_booking_number', 'vendor_booking_status', 'shipper', 'consignee',
      'transportation_mode', 'cargo_readiness_date', 'service_type', 'volume',
      'weight', 'port_of_loading', 'port_of_discharge', 'customer', 'vendor', 'origin_partner',
      'equipment_count', 'equipment_size_type', 'equipment_numbers'
    ];
    
    // Optional fields
    const optionalColumns = [
      'hs_code', 'cargo_description', 'marks_and_numbers', 'customer_reference',
      'cargo_type', 'dangerous_goods_notes', 'place_of_receipt', 'place_of_delivery',
      'carrier', 'carrier_booking_number'
    ];
    
    // System fields
    const systemColumns = ['created_on', 'modified_on'];

    if (mandatoryColumns.includes(columnId)) return 'mandatory';
    if (optionalColumns.includes(columnId)) return 'optional';
    if (systemColumns.includes(columnId)) return 'system';
    return 'optional';
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = shipmentOrders.length;
    const draft = shipmentOrders.filter(so => so.vendor_booking_status === 'draft').length;
    const confirmed = shipmentOrders.filter(so => so.vendor_booking_status === 'confirmed').length;
    const shipped = shipmentOrders.filter(so => so.vendor_booking_status === 'shipped').length;
    
    return { total, draft, confirmed, shipped };
  }, [shipmentOrders]);

  // No client-side filtering needed since we're using server-side filtering
  const filteredData = shipmentOrders;

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
            <span className="text-xs">
              {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
            </span>
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
            <span className="text-xs">
              {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
            </span>
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
  
      columnHelper.accessor("shipper", {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Shipper
            <span className="text-xs">
              {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
            </span>
          </button>
        ),
        cell: (info) => (
          <span className="text-sm text-gray-900 dark:text-white">
            {info.getValue()}
          </span>
        ),
      }),

      columnHelper.accessor("consignee", {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Consignee
            <span className="text-xs">
              {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
            </span>
          </button>
        ),
        cell: (info) => (
          <span className="text-sm text-gray-900 dark:text-white">
            {info.getValue()}
          </span>
        ),
      }),

      columnHelper.accessor("transportation_mode", {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Transport Mode
            <span className="text-xs">
              {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
            </span>
          </button>
        ),
        cell: (info) => {
          const mode = info.getValue();
          const modeColors: Record<string, string> = {
            ocean: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
            air: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            road: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
            rail: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
          };
          
          return (
            <span className={`px-2 py-1 text-xs rounded-full ${modeColors[mode] || 'bg-gray-100 text-gray-800'}`}>
              {mode?.toUpperCase() || '-'}
            </span>
          );
        },
      }),

      columnHelper.accessor("service_type", {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Service Type
            <span className="text-xs">
              {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
            </span>
          </button>
        ),
        cell: (info) => {
          const serviceType = info.getValue();
          return (
            <span className="text-sm text-gray-900 dark:text-white">
              {serviceType?.toUpperCase() || '-'}
            </span>
          );
        },
      }),

      columnHelper.accessor("cargo_readiness_date", {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Cargo Ready Date
            <span className="text-xs">
              {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
            </span>
          </button>
        ),
        cell: (info) => (
          <span className="text-sm text-gray-900 dark:text-white">
            {info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '-'}
          </span>
        ),
      }),

      columnHelper.accessor("volume", {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Volume (CBM)
            <span className="text-xs">
              {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
            </span>
          </button>
        ),
        cell: (info) => (
          <span className="text-sm text-gray-900 dark:text-white font-mono">
            {info.getValue()?.toLocaleString() || '-'}
          </span>
        ),
      }),

      columnHelper.accessor("weight", {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Weight (KG)
            <span className="text-xs">
              {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
            </span>
          </button>
        ),
        cell: (info) => (
          <span className="text-sm text-gray-900 dark:text-white font-mono">
            {info.getValue()?.toLocaleString() || '-'}
          </span>
        ),
      }),

      columnHelper.accessor("customer_name", {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Customer
            <span className="text-xs">
              {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
            </span>
          </button>
        ),
        cell: (info) => (
          <span className="text-sm text-gray-900 dark:text-white">
            {info.getValue() || '-'}
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
            <span className="text-xs">
              {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
            </span>
          </button>
        ),
        cell: (info) => (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '-'}
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
  

  // Table setup - server-side filtering and pagination
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    manualPagination: true,
    manualSorting: true,
    pageCount: pagination.totalPages,
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
          {/* Search Row */}
          <div className="mb-4">
            <Input
              placeholder="Search shipment orders..."
              value={globalFilter}
              onChange={(e) => handleGlobalFilterChange(e.target.value)}
              className="w-full focus:ring-theme-purple-500 focus:border-theme-purple-500"
            />
          </div>

          {/* Filter Controls Row */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Customer Filter */}
            <div className="w-full lg:w-64">
              <CustomerFilterDropdown
                selectedCustomerId={customerFilter}
                onCustomerChange={setCustomerFilter}
              />
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ShipmentOrderStatus | "")}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white text-sm w-full"
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
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white text-sm w-full"
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
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white text-sm w-full"
            >
              <option value="">All Services</option>
              <option value="cy">CY (Container Yard)</option>
              <option value="cfs">CFS (Container Freight Station)</option>
            </select>

              {/* Cargo Type Filter */}
              <select
                value={cargoTypeFilter}
                onChange={(e) => setCargoTypeFilter(e.target.value as CargoType | "")}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white text-sm w-full"
              >
                <option value="">All Cargo Types</option>
                <option value="normal">Normal</option>
                <option value="reefer">Reefer</option>
                <option value="dg">Dangerous Goods</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              {/* Advanced Filters Toggle */}
              <Button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                size="sm"
                variant="outline"
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap flex-1 sm:flex-none"
              >
                <FilterIcon className="w-4 h-4 mr-2" />
                {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
              </Button>

              {/* Clear Filters Button */}
              <Button
                onClick={clearAllFilters}
                size="sm"
                variant="outline"
                className="border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 whitespace-nowrap flex-1 sm:flex-none"
              >
                Clear All
              </Button>

            {/* Configuration Button */}
            <Button
              onClick={() => setIsConfigDrawerOpen(true)}
              size="sm"
              variant="outline"
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap flex-1 sm:flex-none"
            >
              <FilterIcon className="w-4 h-4 mr-2" />
                Column Setting
            </Button>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              size="sm"
              variant="outline"
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap flex-1 sm:flex-none"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export
            </Button>

            {/* Add Button */}
            <Button
              onClick={handleCreate}
              size="sm"
              className="bg-theme-purple-600 hover:bg-theme-purple-700 text-white px-4 py-2 whitespace-nowrap flex-1 sm:flex-none"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Order
            </Button>
          </div>
        </div>
        </div>

        {/* Advanced Filters Section */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Volume Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Volume (CBM)
                </label>
                <Input
                  type="number"
                  placeholder="Min volume"
                  value={apiFilters.volume || ''}
                  onChange={(e) => setApiFilters(prev => ({ 
                    ...prev, 
                    volume: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  className="w-full"
                />
              </div>

              {/* Weight Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Weight (KG)
                </label>
                <Input
                  type="number"
                  placeholder="Min weight"
                  value={apiFilters.weight || ''}
                  onChange={(e) => setApiFilters(prev => ({ 
                    ...prev, 
                    weight: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  className="w-full"
                />
              </div>

              {/* HS Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  HS Code
                </label>
                <Input
                  placeholder="Enter HS code"
                  value={apiFilters.hs_code || ''}
                  onChange={(e) => setApiFilters(prev => ({ 
                    ...prev, 
                    hs_code: e.target.value || undefined 
                  }))}
                  className="w-full"
                />
              </div>

              {/* Carrier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Carrier
                </label>
                <Input
                  placeholder="Enter carrier name"
                  value={apiFilters.carrier || ''}
                  onChange={(e) => setApiFilters(prev => ({ 
                    ...prev, 
                    carrier: e.target.value || undefined 
                  }))}
                  className="w-full"
                />
              </div>

              {/* Place of Receipt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Place of Receipt
                </label>
                <Input
                  placeholder="Enter place of receipt"
                  value={apiFilters.place_of_receipt || ''}
                  onChange={(e) => setApiFilters(prev => ({ 
                    ...prev, 
                    place_of_receipt: e.target.value || undefined 
                  }))}
                  className="w-full"
                />
              </div>

              {/* Place of Delivery */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Place of Delivery
                </label>
                <Input
                  placeholder="Enter place of delivery"
                  value={apiFilters.place_of_delivery || ''}
                  onChange={(e) => setApiFilters(prev => ({ 
                    ...prev, 
                    place_of_delivery: e.target.value || undefined 
                  }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading shipment orders...</p>
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
                    {loading ? 'Loading...' : 'No shipment orders found'}
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
              {loading ? 'Loading...' : 'No shipment orders found'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {table.getRowModel().rows.map((row) => (
                <div key={row.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="space-y-3">
                    {/* Booking Number and Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm text-theme-purple-600 dark:text-theme-purple-400">
                          {row.original.vendor_booking_number}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        row.original.vendor_booking_status === 'draft' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                        row.original.vendor_booking_status === 'confirmed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                        row.original.vendor_booking_status === 'booked' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' :
                        row.original.vendor_booking_status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                        'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {row.original.vendor_booking_status}
                      </span>
                    </div>

                    {/* Shipper and Consignee */}
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Shipper:</span>
                        <p className="text-sm text-gray-900 dark:text-white">{row.original.shipper}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Consignee:</span>
                        <p className="text-sm text-gray-900 dark:text-white">{row.original.consignee}</p>
                      </div>
                    </div>

                    {/* Transport and Service */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Transport:</span>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {row.original.transportation_mode?.toUpperCase() || '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Service:</span>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {row.original.service_type?.toUpperCase() || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Volume and Weight */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Volume:</span>
                        <p className="text-sm text-gray-900 dark:text-white font-mono">
                          {row.original.volume?.toLocaleString() || '-'} CBM
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Weight:</span>
                        <p className="text-sm text-gray-900 dark:text-white font-mono">
                          {row.original.weight?.toLocaleString() || '-'} KG
                        </p>
                      </div>
                    </div>

                    {/* Customer and Date */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Customer:</span>
                        <p className="text-sm text-gray-900 dark:text-white">{row.original.customer_name || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Created:</span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {row.original.created_on ? new Date(row.original.created_on).toLocaleDateString() : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(row.original)}
                          className="flex-1"
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        
                        {row.original.vendor_booking_status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(row.original.id, "confirmed")}
                            className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
                          >
                            Confirm
                          </Button>
                        )}

                        {row.original.vendor_booking_status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(row.original.id, "booked")}
                            className="flex-1 text-purple-600 border-purple-300 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-900/20"
                          >
                            Book
                          </Button>
                        )}

                        {row.original.vendor_booking_status === "booked" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(row.original.id, "shipped")}
                            className="flex-1 text-green-600 border-green-300 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20"
                          >
                            Ship
                          </Button>
                        )}

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
      {pagination.total > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700 dark:text-gray-300 order-2 sm:order-1">
            Showing {pagination.page * pagination.pageSize + 1} to{" "}
            {Math.min(
              (pagination.page + 1) * pagination.pageSize,
              pagination.total
            )}{" "}
            of {pagination.total} results
          </div>
          <div className="order-1 sm:order-2">
          <Pagination
              currentPage={pagination.page + 1}
              totalPages={pagination.totalPages}
              onPageChange={(page: number) => {
                setPagination(prev => ({
                  ...prev,
                  page: page - 1
                }));
              }}
            />
          </div>
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
