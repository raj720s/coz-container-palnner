"use client";

import { withSimpleRBAC } from "@/components/auth/withSimpleRBAC";
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

function AssignmentResultsManager() {
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
        shipmentId: "QL30258155",
        customer: "BON PRIX",
        optimizedContainerRef: "CONT_002_40HC",
        containerType: "40HC",
        minThreshold: 54.8,
        maxThreshold: 62,
        totalCBM: 57.645,
        volume: 54.024,
        pol: "Qingdao",
        destsite: "HALDENSLEBEN",
        qty: 3217,
        totalQty: 12212,
        status: "assigned",
        createdAt: "2024-01-15",
      },
    ];
  };

  const [data] = useState<AssignmentResult[]>(getAssignmentData());

  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  // Define columns inside the component to avoid infinite re-renders
  const columns = useMemo(() => [
    columnHelper.accessor("customer", { 
      header: "Customer", 
      cell: (info) => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor("shipmentId", { 
      header: "Shipment", 
      cell: (info) => <span className="font-mono text-sm">{info.getValue()}</span>
    }),
    columnHelper.accessor("optimizedContainerRef", { 
      header: "Optimized Container Ref", 
      cell: (info) => (
        <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
          {info.getValue() || "-"}
        </span>
      )
    }),
    columnHelper.accessor("containerType", { 
      header: "Cont. Type", 
      cell: (info) => (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("minThreshold", { 
      header: "Min. Threshold", 
      cell: (info) => <span className="text-sm">{info.getValue().toFixed(1)}</span>
    }),
    columnHelper.accessor("maxThreshold", { 
      header: "Max. Threshold", 
      cell: (info) => <span className="text-sm">{info.getValue().toFixed(1)}</span>
    }),
    columnHelper.accessor("totalCBM", { 
      header: "Total CBM", 
      cell: (info) => <span className="font-medium">{info.getValue().toFixed(2)}</span>
    }),
    columnHelper.accessor("volume", { 
      header: "CBM", 
      cell: (info) => <span className="text-sm">{info.getValue().toFixed(2)}</span>
    }),
    columnHelper.accessor("pol", { 
      header: "POL", 
      cell: (info) => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor("destsite", { 
      header: "Destination", 
      cell: (info) => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor("qty", { 
      header: "Qty", 
      cell: (info) => <span className="text-sm">{info.getValue().toLocaleString()}</span>
    }),
    columnHelper.accessor("totalQty", { 
      header: "Total Qty", 
      cell: (info) => <span className="font-medium">{info.getValue().toLocaleString()}</span>
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          info.getValue() === "assigned"
            ? "bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300"
            : info.getValue() === "unassigned"
            ? "bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300"
            : "bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300"
        }`}>
          {info.getValue()}
        </span>
      ),
    }),
  ], []);

  const filteredData = useMemo(() => data.filter(item => {
    const matchesSearch =
      item.shipmentId.toLowerCase().includes(globalFilter.toLowerCase()) ||
      item.customer.toLowerCase().includes(globalFilter.toLowerCase()) ||
      item.optimizedContainerRef.toLowerCase().includes(globalFilter.toLowerCase()) ||
      item.pol.toLowerCase().includes(globalFilter.toLowerCase()) ||
      item.destsite.toLowerCase().includes(globalFilter.toLowerCase());

    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  }), [data, globalFilter, statusFilter]);

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

  const exportToExcel = () => {
    const headers = [
      "Customer", "Shipment", "Optimized Container Ref", "Cont. Type", "Min. Threshold", "Max. Threshold", "Total CBM", "CBM", "POL", "Destination", "Qty", "Total Qty", "Status"
    ];
    
    const csvContent = [
      headers.join(","),
      ...filteredData.map(row => [
        row.customer,
        row.shipmentId,
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
        row.status
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assignment_results.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Export completed successfully");
  };

  const getSummaryStats = useMemo(() => {
    const total = filteredData.length;
    const assigned = filteredData.filter(item => item.status === "assigned").length;
    const unassigned = filteredData.filter(item => item.status === "unassigned").length;
    const errors = filteredData.filter(item => item.status === "error").length;

    return { total, assigned, unassigned, errors };
  }, [filteredData]);

  const stats = getSummaryStats;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Container Assignment Results
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage container assignment results from the latest planning run
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Shipments</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.assigned}</div>
          <div className="text-sm text-green-600 dark:text-green-400">Assigned</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.unassigned}</div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400">Unassigned</div>
        </div>

      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search shipments, customers, or container refs..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
            <option value="error">Error</option>
          </select>

          <Button onClick={exportToExcel} size="sm">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export to Excel
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
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    row.original.status === "error" ? "bg-error-50 dark:bg-error-900/20" : ""
                  }`}
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
          No assignment results found matching your filters.
        </div>
      )}
    </div>
  );
}

export default withSimpleRBAC(AssignmentResultsManager, {
  route: "/admin/assignment-results",
  privilege: "VIEW_ASSIGNMENT_RESULTS"
}); 