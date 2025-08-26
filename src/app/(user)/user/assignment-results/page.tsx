"use client";

import { withRouteAuth } from "@/components/auth/withAuth";
import Button from "@/components/ui/button/Button";
import toast from "react-hot-toast";
import React, { useState, useMemo } from "react";
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
import { DownloadIcon } from "@/icons";

interface AssignmentResult {
  id: string;
  shipmentId: string;
  customer: string;
  optimizedContainerRef: string;
  containerType: string;
  minThreshold: number;
  maxThreshold: number;
  totalCBM: number;
  volume: number;
  pol: string;
  destsite: string;
  qty: number;
  totalQty: number;
  status: "assigned" | "unassigned" | "error";
  createdAt: string;
}

const columnHelper = createColumnHelper<AssignmentResult>();

function AssignmentResultsPage() {
  // Get planning results from session storage or use mock data
  const getAssignmentData = (): AssignmentResult[] => {
    try {
      const storedData = sessionStorage.getItem('planningResults');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        return parsed.assignments.map((assignment: Record<string, unknown>, index: number) => ({
          id: (index + 1).toString(),
          shipmentId: (assignment.shipmentId as string) || '',
          customer: (assignment.customer as string) || '',
          optimizedContainerRef: (assignment.containerRef as string) || (assignment.optimizedContainerRef as string) || '',
          containerType: (assignment.containerType as string) || 'Unknown',
          minThreshold: (assignment.minThreshold as number) || 0,
          maxThreshold: (assignment.maxThreshold as number) || 0,
          totalCBM: (assignment.totalCBM as number) || (assignment.volume as number) || 0,
          volume: (assignment.volume as number) || (assignment.cbm as number) || 0,
          pol: (assignment.pol as string) || '',
          destsite: (assignment.pod as string) || (assignment.destsite as string) || '',
          qty: (assignment.qty as number) || 0,
          totalQty: (assignment.totalQty as number) || 0,
          status: (assignment.status as string) || 'assigned',
          createdAt: new Date().toISOString().split('T')[0],
        }));
      }
    } catch (error) {
      console.error('Error parsing planning results:', error);
    }

    // Fallback to mock data matching Book-results.xlsx format
    return [
      {
        id: "1",
        shipmentId: "QL30258221",
        customer: "BON PRIX",
        optimizedContainerRef: "CONT_001_40HC",
        containerType: "40HC",
        minThreshold: 54.8,
        maxThreshold: 62,
        totalCBM: 61.381,
        volume: 56.557,
        pol: "Qingdao",
        destsite: "HALDENSLEBEN",
        qty: 2873,
        totalQty: 4376,
        status: "assigned",
        createdAt: "2024-01-15",
      },
      {
        id: "2",
        shipmentId: "QL30258201",
        customer: "BON PRIX",
        optimizedContainerRef: "CONT_001_40HC",
        containerType: "40HC",
        minThreshold: 54.8,
        maxThreshold: 62,
        totalCBM: 61.381,
        volume: 4.824,
        pol: "Qingdao",
        destsite: "HALDENSLEBEN",
        qty: 1503,
        totalQty: 4376,
        status: "assigned",
        createdAt: "2024-01-15",
      },
      {
        id: "3",
        shipmentId: "QL30258203",
        customer: "BON PRIX",
        optimizedContainerRef: "CONT_002_40HC",
        containerType: "40HC",
        minThreshold: 54.8,
        maxThreshold: 62,
        totalCBM: 58.234,
        volume: 52.891,
        pol: "Yantian",
        destsite: "BERLIN",
        qty: 2100,
        totalQty: 2100,
        status: "assigned",
        createdAt: "2024-01-15",
      },
      {
        id: "4",
        shipmentId: "QL30258205",
        customer: "OTTO GME",
        optimizedContainerRef: "CONT_003_40FT",
        containerType: "40FT",
        minThreshold: 44.8,
        maxThreshold: 54.8,
        totalCBM: 51.876,
        volume: 48.123,
        pol: "Qingdao",
        destsite: "HAMBURG",
        qty: 1850,
        totalQty: 1850,
        status: "assigned",
        createdAt: "2024-01-15",
      },
      {
        id: "5",
        shipmentId: "QL30258207",
        customer: "OTTO GME",
        optimizedContainerRef: "CONT_004_20GP",
        containerType: "20GP",
        minThreshold: 19.9,
        maxThreshold: 23,
        totalCBM: 22.456,
        volume: 20.789,
        pol: "Yantian",
        destsite: "MUNICH",
        qty: 950,
        totalQty: 950,
        status: "assigned",
        createdAt: "2024-01-15",
      },
      {
        id: "6",
        shipmentId: "QL30258209",
        customer: "ABC Corp",
        optimizedContainerRef: "CONT_005_40HC",
        containerType: "40HC",
        minThreshold: 54.8,
        maxThreshold: 62,
        totalCBM: 59.123,
        volume: 55.678,
        pol: "Qingdao",
        destsite: "FRANKFURT",
        qty: 2200,
        totalQty: 2200,
        status: "assigned",
        createdAt: "2024-01-15",
      },
      {
        id: "7",
        shipmentId: "QL30258211",
        customer: "ABC Corp",
        optimizedContainerRef: "CONT_006_40FT",
        containerType: "40FT",
        minThreshold: 44.8,
        maxThreshold: 54.8,
        totalCBM: 49.876,
        volume: 46.234,
        pol: "Yantian",
        destsite: "COLOGNE",
        qty: 1750,
        totalQty: 1750,
        status: "assigned",
        createdAt: "2024-01-15",
      },
      {
        id: "8",
        shipmentId: "QL30258213",
        customer: "XYZ Ltd",
        optimizedContainerRef: "CONT_007_20GP",
        containerType: "20GP",
        minThreshold: 19.9,
        maxThreshold: 23,
        totalCBM: 21.987,
        volume: 19.456,
        pol: "Qingdao",
        destsite: "STUTTGART",
        qty: 800,
        totalQty: 800,
        status: "assigned",
        createdAt: "2024-01-15",
      },
      {
        id: "9",
        shipmentId: "QL30258215",
        customer: "XYZ Ltd",
        optimizedContainerRef: "CONT_008_40HC",
        containerType: "40HC",
        minThreshold: 54.8,
        maxThreshold: 62,
        totalCBM: 60.234,
        volume: 57.891,
        pol: "Yantian",
        destsite: "DUSSELDORF",
        qty: 2400,
        totalQty: 2400,
        status: "assigned",
        createdAt: "2024-01-15",
      },
      {
        id: "10",
        shipmentId: "QL30258217",
        customer: "DEF Inc",
        optimizedContainerRef: "CONT_009_40FT",
        containerType: "40FT",
        minThreshold: 44.8,
        maxThreshold: 54.8,
        totalCBM: 52.123,
        volume: 49.567,
        pol: "Qingdao",
        destsite: "LEIPZIG",
        qty: 1900,
        totalQty: 1900,
        status: "assigned",
        createdAt: "2024-01-15",
      },
    ];
  };

  const [data] = useState<AssignmentResult[]>(getAssignmentData());
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(() => [
    columnHelper.accessor("shipmentId", {
      header: "Shipment ID",
      cell: (info) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("customer", {
      header: "Customer",
      cell: (info) => (
        <span className="text-gray-700 dark:text-gray-300">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("optimizedContainerRef", {
      header: "Container Ref",
      cell: (info) => (
        <span className="font-mono text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("containerType", {
      header: "Container Type",
      cell: (info) => (
        <span className="text-gray-700 dark:text-gray-300">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("minThreshold", {
      header: "Min Threshold",
      cell: (info) => (
        <span className="text-gray-600 dark:text-gray-400">
          {info.getValue().toFixed(1)}
        </span>
      ),
    }),
    columnHelper.accessor("maxThreshold", {
      header: "Max Threshold",
      cell: (info) => (
        <span className="text-gray-600 dark:text-gray-400">
          {info.getValue().toFixed(1)}
        </span>
      ),
    }),
    columnHelper.accessor("totalCBM", {
      header: "Total CBM",
      cell: (info) => (
        <span className="font-mono text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
          {info.getValue().toFixed(3)}
        </span>
      ),
    }),
    columnHelper.accessor("volume", {
      header: "Volume",
      cell: (info) => (
        <span className="text-gray-600 dark:text-gray-400">
          {info.getValue().toFixed(3)}
        </span>
      ),
    }),
    columnHelper.accessor("pol", {
      header: "POL",
      cell: (info) => (
        <span className="text-gray-700 dark:text-gray-300">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("destsite", {
      header: "Destination",
      cell: (info) => (
        <span className="text-gray-700 dark:text-gray-300">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("qty", {
      header: "Quantity",
      cell: (info) => (
        <span className="text-gray-600 dark:text-gray-400">
          {info.getValue().toLocaleString()}
        </span>
      ),
    }),
    columnHelper.accessor("totalQty", {
      header: "Total Qty",
      cell: (info) => (
        <span className="text-gray-600 dark:text-gray-400">
          {info.getValue().toLocaleString()}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          info.getValue() === "assigned"
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : info.getValue() === "unassigned"
            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        }`}>
          {info.getValue()}
        </span>
      ),
    }),
  ], []);

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
  });

  const handleExport = () => {
    try {
      // Create CSV content
      const headers = [
        "Shipment ID",
        "Customer",
        "Container Ref",
        "Container Type",
        "Min Threshold",
        "Max Threshold",
        "Total CBM",
        "Volume",
        "POL",
        "Destination",
        "Quantity",
        "Total Quantity",
        "Status",
        "Created Date"
      ];

      const csvContent = [
        headers.join(","),
        ...data.map(row => [
          row.shipmentId,
          row.customer,
          row.optimizedContainerRef,
          row.containerType,
          row.minThreshold,
          row.maxThreshold,
          row.totalCBM,
          row.volume,
          row.pol,
          row.destsite,
          row.qty,
          row.totalQty,
          row.status,
          row.createdAt
        ].join(","))
      ].join("\n");

      // Download CSV file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "assignment_results.csv";
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Results exported successfully!");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Export failed. Please try again.");
    }
  };

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalShipments = data.length;
    const assignedShipments = data.filter(item => item.status === "assigned").length;
    const totalCBM = data.reduce((sum, item) => sum + item.totalCBM, 0);
    const totalVolume = data.reduce((sum, item) => sum + item.volume, 0);
    const totalQuantity = data.reduce((sum, item) => sum + item.totalQty, 0);

    return {
      totalShipments,
      assignedShipments,
      totalCBM: totalCBM.toFixed(3),
      totalVolume: totalVolume.toFixed(3),
      totalQuantity: totalQuantity.toLocaleString(),
    };
  }, [data]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Assignment Results
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review container assignment results and export data
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Shipments</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalShipments}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Assigned</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.assignedShipments}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total CBM</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.totalCBM}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Volume</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.totalVolume}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Quantity</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary.totalQuantity}</div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Input
            placeholder="Search results..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <DownloadIcon className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
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
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* No Results Message */}
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No assignment results found. Please run container planning first.
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">
          Understanding Assignment Results
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Container Assignment</h4>
            <p>Each shipment is assigned to an optimized container based on volume, weight, and destination requirements.</p>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Threshold Compliance</h4>
            <p>Container loads are optimized to stay within minimum and maximum capacity thresholds for efficient utilization.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRouteAuth(AssignmentResultsPage, "user/assignment-results"); 