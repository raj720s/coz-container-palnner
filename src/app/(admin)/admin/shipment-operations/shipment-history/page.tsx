"use client";

import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";
import Button from "@/components/ui/button/Button";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { 
  DownloadIcon, 
  EyeIcon, 
  FilterIcon,
  RefreshIcon, 
  PackageIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  TruckIcon
} from "@/icons";
import { localStorageService, type UploadedFile } from '@/utils/localStorageService';

interface ShipmentDataRow {
  SHIPMENT?: string;
  CUSTOMER?: string;
  CUSTOME?: string;
  SUPPLIER?: string;
  VOLUME?: string;
  Qty?: string;
  'RCV/PUG'?: string;
  POL?: string;
  Destsite?: string;
  [key: string]: string | undefined;
}

interface ExtendedUploadedFile extends UploadedFile {
  validData?: ShipmentDataRow[];
}

interface Shipment {
  id: string;
  shipmentId: string;
  customer: string;
  supplier: string;
  volume: number;
  quantity: number;
  rcvPug: string;
  pol: string;
  destsite: string;
  status: "pending" | "assigned" | "shipped" | "delivered";
  containerId?: string;
  uploadDate: string;
  fileId: string;
}

const columnHelper = createColumnHelper<Shipment>();

function ShipmentHistoryPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [polFilter, setPolFilter] = useState<string>("all");

  // Load shipments from localStorage on component mount
  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = () => {
    try {
      setLoading(true);
      // Get all uploaded files and extract shipment data
      const files = localStorageService.getUploadedFiles();
      const allShipments: Shipment[] = [];
      
      files.forEach((file: ExtendedUploadedFile) => {
        if (file.validData && Array.isArray(file.validData)) {
          file.validData.forEach((shipment: ShipmentDataRow, index: number) => {
            allShipments.push({
              id: `${file.id}_${index}`,
              shipmentId: shipment.SHIPMENT || `SHIP_${index}`,
              customer: shipment.CUSTOMER || shipment.CUSTOME || 'Unknown',
              supplier: shipment.SUPPLIER || 'Unknown',
              volume: parseFloat(shipment.VOLUME || '0') || 0,
              quantity: parseInt(shipment.Qty || '0') || 0,
              rcvPug: shipment['RCV/PUG'] || 'Unknown',
              pol: shipment.POL || 'Unknown',
              destsite: shipment.Destsite || 'Unknown',
              status: "pending", // Default status
              uploadDate: file.uploadDate,
              fileId: file.id
            });
          });
        }
      });
      
      setShipments(allShipments);
    } catch (error) {
      console.error('Error loading shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor("shipmentId", { 
      header: "Shipment ID", 
      cell: (info) => (
        <div className="flex items-center gap-2">
          <PackageIcon className="w-4 h-4 text-blue-500" />
          <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
            {info.getValue()}
          </span>
        </div>
      )
    }),
    columnHelper.accessor("customer", { 
      header: "Customer", 
      cell: (info) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("supplier", { 
      header: "Supplier", 
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("volume", { 
      header: "Volume (CBM)", 
      cell: (info) => (
        <span className="font-mono text-sm text-gray-900 dark:text-white">
          {info.getValue().toFixed(2)}
        </span>
      )
    }),
    columnHelper.accessor("quantity", { 
      header: "Quantity", 
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("pol", { 
      header: "POL", 
      cell: (info) => (
        <div className="flex items-center gap-1">
          <MapPinIcon className="w-3 h-3 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {info.getValue()}
          </span>
        </div>
      )
    }),
    columnHelper.accessor("destsite", { 
      header: "Destination", 
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("rcvPug", { 
      header: "RCV/PUG", 
      cell: (info) => (
        <div className="flex items-center gap-1">
          <CalendarIcon className="w-3 h-3 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {info.getValue()}
          </span>
        </div>
      )
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => {
        const status = info.getValue();
        const statusConfig = {
          pending: { 
            label: "Pending", 
            className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" 
          },
          assigned: { 
            label: "Assigned", 
            className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" 
          },
          shipped: { 
            label: "Shipped", 
            className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" 
          },
          delivered: { 
            label: "Delivered", 
            className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
          }
        };
        
        const config = statusConfig[status];
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
            {config.label}
          </span>
        );
      },
    }),
    columnHelper.accessor("uploadDate", {
      header: "Upload Date",
      cell: (info) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(info.getValue()).toLocaleDateString()}
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
            onClick={() => viewShipmentDetails(info.row.original)}
            className="p-1"
          >
            <EyeIcon className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => assignContainer(info.row.original)}
            className="p-1"
            disabled={info.row.original.status !== "pending"}
          >
            <TruckIcon className="w-4 h-4" />
          </Button>
        </div>
      ),
    }),
  ], []);

  const filteredData = useMemo(() => {
    return shipments.filter(item => {
      const matchesSearch =
        item.shipmentId.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.customer.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.supplier.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.pol.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.destsite.toLowerCase().includes(globalFilter.toLowerCase());
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesPOL = polFilter === "all" || item.pol === polFilter;
      return matchesSearch && matchesStatus && matchesPOL;
    });
  }, [shipments, globalFilter, statusFilter, polFilter]);

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

  const viewShipmentDetails = (shipment: Shipment) => {
    // Navigate to shipment details or show modal
    router.push(`/admin/shipment-operations/shipment-details/${shipment.id}`);
  };

  const assignContainer = (shipment: Shipment) => {
    // Navigate to container assignment
    router.push(`/admin/container-planning?shipmentId=${shipment.id}`);
  };

  const exportShipments = () => {
    const headers = ["Shipment ID", "Customer", "Supplier", "Volume", "Quantity", "POL", "Destination", "RCV/PUG", "Status", "Upload Date"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map(row => [
        row.shipmentId,
        row.customer,
        row.supplier,
        row.volume,
        row.quantity,
        row.pol,
        row.destsite,
        row.rcvPug,
        row.status,
        new Date(row.uploadDate).toLocaleDateString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shipment_history.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get unique POLs for filter
  const uniquePOLs = useMemo(() => {
    const pols = [...new Set(shipments.map(s => s.pol))];
    return pols.filter(pol => pol && pol !== 'Unknown');
  }, [shipments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading shipment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Shipment History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all shipment records from uploaded files
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportShipments} size="sm" variant="outline">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={loadShipments} size="sm" variant="outline">
            <RefreshIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <PackageIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Shipments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{shipments.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <PackageIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {shipments.filter(s => s.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <TruckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Assigned</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {shipments.filter(s => s.status === 'assigned').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <UserIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Customers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Set(shipments.map(s => s.customer)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search shipments by ID, customer, supplier, POL, or destination..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-md"
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
          
          <select
            value={polFilter}
            onChange={(e) => setPolFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All POLs</option>
            {uniquePOLs.map(pol => (
              <option key={pol} value={pol}>{pol}</option>
            ))}
          </select>
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
          {shipments.length === 0 
            ? "No shipments found. Upload shipment files to get started."
            : "No shipments match your search criteria."
          }
        </div>
      )}
    </div>
  );
}

export default withSimplifiedRBAC(ShipmentHistoryPage, {
  route: "/admin/shipment-operations/shipment-history"
});
