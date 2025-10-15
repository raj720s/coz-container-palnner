"use client";
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  ShipmentOrderFormData,
  ShipmentOrderStatus,
  TransportationMode,
  ServiceType,
  CargoType,
  ShipmentListRequest,
  ShipmentListResponse,
} from "@/types/shipmentOrder";
import { shipmentOrderService, ShipmentOrderInput } from "@/services/shipmentOrderService";
import { ShipmentOrderForm } from "@/components/forms/ShipmentOrderForm";
import { FormModal } from "@/components/ui/modal/FormModal";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { withSimplifiedRBAC, SimplifiedRBACProps } from "@/components/auth/withSimplifiedRBAC";
import { 
  PlusIcon, 
  PencilIcon, 
  TrashBinIcon, 
  DownloadIcon,
} from "@/icons";
import toast from "react-hot-toast";

// AG Grid imports
import type {
  ColDef,
  ICellRendererParams,
  GridApi,
} from "ag-grid-community";
import { 
  AllCommunityModule, 
  ModuleRegistry,
  CsvExportModule,
} from "ag-grid-community";
import { 
  AgGridReact,
} from "ag-grid-react";
import { ExcelExportModule } from "ag-grid-enterprise";

ModuleRegistry.registerModules([
  AllCommunityModule,
  CsvExportModule,
  ExcelExportModule,
]);

// Custom Cell Renderers
const StatusRenderer = (params: ICellRendererParams) => {
  const status = params.value as ShipmentOrderStatus;
  const statusColors = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    shipped: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    booked: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${
        statusColors[status] || statusColors.draft
      }`}
    >
      {status?.toUpperCase() || "DRAFT"}
    </span>
  );
};

const TransportationModeRenderer = (params: ICellRendererParams) => {
  const mode = params.value as TransportationMode;
  const modeIcons = {
    ocean: "🚢",
    air: "✈️",
    road: "🚛",
    rail: "🚂",
  };

  return (
    <span className="flex items-center gap-2">
      <span>{modeIcons[mode] || "🚢"}</span>
      <span className="capitalize">{mode || "Ocean"}</span>
    </span>
  );
};

const ServiceTypeRenderer = (params: ICellRendererParams) => {
  return (
    <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 rounded-full uppercase font-semibold">
      {params.value || "CY"}
    </span>
  );
};

const CargoTypeRenderer = (params: ICellRendererParams) => {
  const cargoType = params.value as CargoType;
  const cargoColors = {
    normal: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    reefer: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    dg: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <span
      className={`px-2 py-1 text-xs rounded-full capitalize ${
        cargoColors[cargoType] || cargoColors.normal
      }`}
    >
      {cargoType || "Normal"}
    </span>
  );
};

const DateRenderer = (params: ICellRendererParams) => {
  if (!params.value) return <span className="text-gray-400">N/A</span>;
  try {
    const date = new Date(params.value);
    return <span className="text-sm">{date.toLocaleDateString()}</span>;
  } catch {
    return <span className="text-gray-400">Invalid Date</span>;
  }
};

const BookingNumberRenderer = (params: ICellRendererParams) => {
  return (
    <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
      {params.value || "N/A"}
    </span>
  );
};

const CustomerRenderer = (params: ICellRendererParams) => {
  return (
    <span className="font-medium text-gray-900 dark:text-gray-100">
      {params.value || "N/A"}
    </span>
  );
};

interface ShipmentOrderManagerProps {
  rbacContext?: SimplifiedRBACProps["rbacContext"];
}

const ShipmentOrderManager: React.FC<ShipmentOrderManagerProps> = ({
  rbacContext,
}) => {
  const gridRef = useRef<AgGridReact<ShipmentListResponse>>(null);
  const [shipmentOrders, setShipmentOrders] = useState<ShipmentListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ShipmentListResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ShipmentListResponse | null>(null);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState<ShipmentListRequest>({
    page: 1,
    page_size: 10,
    order_by: "created_on",
    order_type: "desc",
  });

  // Pagination state for AG Grid
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 0,
    totalPages: 0,
    totalRecords: 0,
    pageSize: 10,
  });

  const { can, isAdmin, isSuperUser } = rbacContext || {};
  const canDeleteShipment = can?.("DELETE_SHIPMENT") || isAdmin?.() || isSuperUser;

  // Load shipment orders
  useEffect(() => {
      loadShipmentOrders();
  }, [filters]);

  // Sync grid pagination with our state when data loads
  useEffect(() => {
    if (gridRef.current && paginationInfo.totalRecords > 0) {
      const api = gridRef.current.api;
      // Set the current page in the grid
      api.paginationGoToPage(paginationInfo.currentPage);
      // Update the total row count
      api.setGridOption('rowData', shipmentOrders);
    }
  }, [paginationInfo, shipmentOrders]);

  const loadShipmentOrders = async () => {
    try {
      setLoading(true);
      console.log('Loading shipment orders with filters:', filters);
      const response = await shipmentOrderService.listShipmentOrders(filters);
      console.log('API response:', response);
      
      setShipmentOrders(response.results || []);
      setTotal(response.count || 0);
      
      // Update pagination info for AG Grid
      const totalPages = Math.ceil((response.count || 0) / filters.page_size);
      const paginationInfo = {
        currentPage: filters.page - 1, // Convert to 0-based for AG Grid
        totalPages,
        totalRecords: response.count || 0,
        pageSize: filters.page_size,
      };
      
      console.log('Updated pagination info:', paginationInfo);
      setPaginationInfo(paginationInfo);
    } catch (error: any) {
      console.error("Error loading shipment orders:", error);
      toast.error(error.message || "Failed to load shipment orders");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
      setEditingOrder(null);
    setIsSubmitting(false);
    setIsModalOpen(true);
  };

  const handleEdit = (order: ShipmentListResponse) => {
    setEditingOrder(order);
    setIsSubmitting(false);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (order: ShipmentListResponse) => {
    if (!canDeleteShipment) {
      toast.error("You don't have permission to delete shipment orders");
      return;
    }

    setDeletingItem(order);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async (data: any) => {
    console.log("ShipmentOrderManager handleSubmit called with data:", data);
    console.log("Editing order:", editingOrder);
    console.log("Is editing:", !!editingOrder);

    if (isSubmitting) {
      console.log("Already submitting, ignoring duplicate submission");
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingOrder) {
        console.log("Updating shipment order:", editingOrder.id);
        console.log("Update payload:", {
          ...data,
          vendor_booking_status: editingOrder.vendor_booking_status,
        });

        const updateResult = await shipmentOrderService.updateShipmentOrder(
          editingOrder.id,
          {
            ...data,
            vendor_booking_status: editingOrder.vendor_booking_status,
          }
        );

        console.log("Update result:", updateResult);
        toast.success("Shipment order updated successfully");
      } else {
        console.log("Creating new shipment order");
        console.log("Create payload:", {
          ...data,
          vendor_booking_status: "draft" as ShipmentOrderStatus,
        });

        const createResult = await shipmentOrderService.createShipmentOrder({
          ...data,
          vendor_booking_status: "draft" as ShipmentOrderStatus,
        });

        console.log("Create result:", createResult);
        toast.success("Shipment order created successfully");
      }
      console.log("Shipment order saved successfully");
      setIsModalOpen(false);
      setEditingOrder(null);
      await loadShipmentOrders();
    } catch (error: any) {
      console.error("Failed to save shipment order:", error);
      console.error("Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
      });
      toast.error(error?.message || "Failed to save shipment order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    if (!canDeleteShipment) {
      toast.error("You don't have permission to delete shipment orders");
      setDeleteModalOpen(false);
      setDeletingItem(null);
      return;
    }

    try {
      setIsSubmitting(true);
      await shipmentOrderService.deleteShipmentOrder(deletingItem.id);
      toast.success("Shipment order deleted successfully");
      setDeleteModalOpen(false);
      setDeletingItem(null);
      await loadShipmentOrders();
    } catch (error: any) {
      console.error("Error deleting shipment order:", error);
      toast.error(error.message || "Failed to delete shipment order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      const exportData = await shipmentOrderService.listShipmentOrders({
        ...filters,
        page_size: 1000,
      });

      const headers = [
        "Booking Number",
        "Status",
        "Shipper",
        "Consignee",
        "Transportation Mode",
        "Service Type",
        "Cargo Readiness Date",
        "Volume",
        "Weight",
        "HS Code",
        "Customer",
        "Created On",
      ];
      const csvRows = [
        headers.join(","),
        ...(exportData.results || []).map((order) =>
          [
            order.vendor_booking_number,
            order.vendor_booking_status,
            order.shipper,
            order.consignee,
            order.transportation_mode,
            order.service_type,
            order.cargo_readiness_date
              ? new Date(order.cargo_readiness_date).toLocaleDateString()
              : "N/A",
            order.volume,
            order.weight,
            order.hs_code,
            order.customer_name || order.customer,
            order.created_on
              ? new Date(order.created_on).toLocaleDateString()
              : "N/A",
          ].join(",")
        ),
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `shipment_orders_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Shipment orders exported to CSV successfully");
    } catch (error: any) {
      console.error("Error exporting shipment orders to CSV:", error);
      toast.error("Failed to export shipment orders to CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = useCallback(() => {
    if (gridRef.current) {
      try {
        gridRef.current.api.exportDataAsExcel({
          fileName: `shipment_orders_${new Date().toISOString().split("T")[0]}.xlsx`,
          sheetName: "Shipment Orders",
        });
        toast.success("Shipment orders exported to Excel successfully");
      } catch (error: any) {
        console.error("Error exporting to Excel:", error);
        toast.error("Failed to export to Excel");
      }
    }
  }, []);

  const handleExport = () => {
    // Default to Excel export
    handleExportExcel();
  };

  const handleSearch = (searchTerm: string) => {
    setGlobalFilter(searchTerm);
    setFilters((prev) => ({
      ...prev,
      search: searchTerm,
      page: 1,
    }));
  };

  // Handle pagination changes
  const onPaginationChanged = useCallback(() => {
    if (gridRef.current) {
      const api = gridRef.current.api;
      const currentPage = api.paginationGetCurrentPage();
      const pageSize = api.paginationGetPageSize();
      
      // Update filters with new page (convert from 0-based to 1-based)
      const newPage = currentPage + 1;
      
      console.log('Pagination changed:', {
        currentPage,
        newPage,
        pageSize,
        currentFilters: filters
      });
      
      if (newPage !== filters.page || pageSize !== filters.page_size) {
        console.log('Updating filters with new pagination:', { newPage, pageSize });
        setFilters(prev => ({
          ...prev,
          page: newPage,
          page_size: pageSize,
        }));
      }
    }
  }, [filters.page, filters.page_size]);


  // Actions Cell Renderer
  const ActionsRenderer = useCallback(
    (params: ICellRendererParams) => {
          return (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(params.data)}
            className="p-1"
          >
            <PencilIcon className="w-4 h-4" />
          </Button>

          {canDeleteShipment && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeleteClick(params.data)}
              className="p-1 text-red-600 hover:text-red-700"
          >
            <TrashBinIcon className="w-4 h-4" />
          </Button>
          )}
        </div>
      );
    },
    [canDeleteShipment]
  );

  // Column Definitions
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "vendor_booking_number",
        headerName: "Booking Number",
        width: 180,
        sortable: true,
        filter: true,
        cellRenderer: BookingNumberRenderer,
        pinned: "left",
      },
      {
        field: "vendor_booking_status",
        headerName: "Status",
        width: 130,
        sortable: true,
        filter: true,
        cellRenderer: StatusRenderer,
      },
      {
        field: "customer_name",
        headerName: "Customer",
        width: 180,
        sortable: true,
        filter: true,
        cellRenderer: CustomerRenderer,
      },
      {
        field: "shipper",
        headerName: "Shipper",
        width: 180,
        sortable: true,
        filter: true,
      },
      {
        field: "consignee",
        headerName: "Consignee",
        width: 180,
        sortable: true,
        filter: true,
      },
      {
        field: "transportation_mode",
        headerName: "Transport Mode",
        width: 160,
        sortable: true,
        filter: true,
        cellRenderer: TransportationModeRenderer,
      },
      {
        field: "service_type",
        headerName: "Service Type",
        width: 130,
        sortable: true,
        filter: true,
        cellRenderer: ServiceTypeRenderer,
      },
      {
        field: "cargo_readiness_date",
        headerName: "Cargo Ready Date",
        width: 150,
        sortable: true,
        filter: true,
        cellRenderer: DateRenderer,
      },
      {
        field: "volume",
        headerName: "Volume (CBM)",
        width: 130,
        sortable: true,
        filter: true,
        valueFormatter: (params) => `${params.value || 0} CBM`,
      },
      {
        field: "weight",
        headerName: "Weight (KG)",
        width: 130,
        sortable: true,
        filter: true,
        valueFormatter: (params) => `${params.value || 0} KG`,
      },
      {
        field: "hs_code",
        headerName: "HS Code",
        width: 130,
        sortable: true,
        filter: true,
      },
      {
        field: "cargo_type",
        headerName: "Cargo Type",
        width: 130,
        sortable: true,
        filter: true,
        cellRenderer: CargoTypeRenderer,
      },
      {
        field: "created_on",
        headerName: "Created On",
        width: 140,
        sortable: true,
        filter: true,
        cellRenderer: DateRenderer,
      },
      {
        headerName: "Actions",
        width: 150,
        cellRenderer: ActionsRenderer,
        sortable: false,
        filter: false,
        pinned: "right",
      },
    ],
    [ActionsRenderer]
  );

  // Default Column Definition
  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    []
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Shipment Orders
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage shipment orders and track their status
        </p>

        {!canDeleteShipment && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md">
          <div className="flex items-center">
              <svg
                className="h-5 w-5 text-yellow-400 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">
                <strong>Read-only mode:</strong> You can view and edit shipment
                orders, but cannot delete records.
              </span>
            </div>
            </div>
        )}
        </div>
        
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Orders
            </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {total}
            </div>
          </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Draft Orders
        </div>
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {shipmentOrders.filter((o) => o.vendor_booking_status === "draft").length}
            </div>
            </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Confirmed Orders
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {
              shipmentOrders.filter((o) => o.vendor_booking_status === "confirmed")
                .length
            }
        </div>
            </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Shipped Orders
            </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {
              shipmentOrders.filter((o) => o.vendor_booking_status === "shipped")
                .length
            }
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
            <Input
              placeholder="Search shipment orders..."
              value={globalFilter}
                onChange={(e) => handleSearch(e.target.value)}
                className="max-w-md"
            />
          </div>
            <div className="flex gap-3">
              <div className="relative">
              <Button
                  type="button"
              onClick={handleExport}
              size="sm"
              variant="outline"
                  disabled={loading}
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
                  Export Excel
            </Button>
          </div>
                        <Button
                type="button"
                onClick={handleExportCSV}
                          size="sm"
                          variant="outline"
                disabled={loading}
                        >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export CSV
                        </Button>
              <Button type="button" onClick={handleCreate} size="sm">
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Shipment Order
                        </Button>
                      </div>
                    </div>
        </div>
      </div>

      {/* AG Grid Table */}
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
        style={{ height: "600px" }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={shipmentOrders}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          loading={loading}
          pagination={true}
          paginationPageSize={filters.page_size}
          paginationAutoPageSize={false}
          suppressPaginationPanel={false}
          domLayout="normal"
          animateRows={true}
          className="ag-theme-alpine"
          onPaginationChanged={onPaginationChanged}
          // Server-side pagination configuration
          paginationPageSizeSelector={[10, 25, 50, 100]}
          // Ensure pagination is server-side
          suppressRowClickSelection={false}
          rowSelection="single"
        />
          </div>

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingOrder(null);
          setIsSubmitting(false);
        }}
        title={
          editingOrder?.id ? "Edit Shipment Order" : "Create Shipment Order"
        }
        size="xl"
      >
        <ShipmentOrderForm
          initialData={editingOrder || undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingOrder(null);
            setIsSubmitting(false);
          }}
          isLoading={isSubmitting}
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
        title="Delete Shipment Order"
        message={`Are you sure you want to delete the shipment order "${deletingItem?.vendor_booking_number}"? This action cannot be undone.`}
        itemName={deletingItem?.vendor_booking_number}
        isLoading={isSubmitting}
        variant="danger"
      />
    </div>
  );
};

export default withSimplifiedRBAC(ShipmentOrderManager, {
  privilege: "VIEW_SHIPMENT_ORDERS",
  module: [70],
  allowSuperUserBypass: true,
  redirectTo: "/dashboard",
});
