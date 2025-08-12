"use client";

import { withUserAuth } from "@/components/auth/withAuth";
import Button from "@/components/ui/button/Button";
import toast from "react-hot-toast";
import React, { useState } from "react";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, getSortedRowModel, getFilteredRowModel, SortingState, ColumnDef, } from "@tanstack/react-table";
import Input from "@/components/form/input/InputField";
import { DownloadIcon, AlertIcon, CheckCircleIcon, TimeIcon } from "@/icons";

interface RepositioningSummary {
  id: string;
  shipmentId: string;
  originalMode: "FCL" | "LCL";
  reassignedMode: "FCL" | "LCL";
  newContainerRef?: string;
  notes: string;
  status: "completed" | "pending" | "review" | "exception";
  costImpact: number;
  reason: string;
  date: string;
}

const columnHelper = createColumnHelper<RepositioningSummary>();

const columns = [
  columnHelper.accessor("shipmentId", {
    header: "Shipment ID",
    cell: (info) => (
      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("originalMode", {
    header: "Original Mode",
    cell: (info) => (
      <span className={`px-2 py-1 text-xs rounded-full ${
        info.getValue() === "FCL" 
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      }`}>
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("reassignedMode", {
    header: "Reassigned Mode",
    cell: (info) => (
      <span className={`px-2 py-1 text-xs rounded-full ${
        info.getValue() === "FCL" 
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      }`}>
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("newContainerRef", {
    header: "New Container Ref",
    cell: (info) => info.getValue() ? (
      <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
        {info.getValue()}
      </span>
    ) : (
      <span className="text-gray-400">-</span>
    ),
  }),
  columnHelper.accessor("reason", {
    header: "Reason",
    cell: (info) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("costImpact", {
    header: "Cost Impact",
    cell: (info) => {
      const impact = info.getValue();
      const isPositive = impact > 0;
      return (
        <span className={`text-sm font-medium ${
          isPositive ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
        }`}>
          {isPositive ? "+" : ""}${Math.abs(impact).toLocaleString()}
        </span>
      );
    },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue();
      const statusConfig = {
        completed: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: CheckCircleIcon },
        pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: TimeIcon },
        review: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", icon: AlertIcon },
        exception: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: AlertIcon }
      };
      const config = statusConfig[status];
      const Icon = config.icon;
      return (
        <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${config.color}`}>
          <Icon className="w-3 h-3" />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    },
  }),
  columnHelper.accessor("date", {
    header: "Date",
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
];

function UserRepositioningSummaryPage() {
  const [data, setData] = useState<RepositioningSummary[]>([
    {
      id: "1",
      shipmentId: "SHP-2024-001",
      originalMode: "FCL",
      reassignedMode: "LCL",
      newContainerRef: "CONT-20FT-001",
      notes: "Optimized for cost efficiency",
      status: "completed",
      costImpact: -450,
      reason: "Cost optimization",
      date: "2024-01-15"
    },
    {
      id: "2",
      shipmentId: "SHP-2024-002",
      originalMode: "LCL",
      reassignedMode: "FCL",
      newContainerRef: "CONT-40HC-002",
      notes: "Volume increase required full container",
      status: "completed",
      costImpact: 200,
      reason: "Volume increase",
      date: "2024-01-16"
    },
    {
      id: "3",
      shipmentId: "SHP-2024-003",
      originalMode: "FCL",
      reassignedMode: "FCL",
      notes: "Container type changed for better fit",
      status: "pending",
      costImpact: 0,
      reason: "Container optimization",
      date: "2024-01-17"
    },
    {
      id: "4",
      shipmentId: "SHP-2024-004",
      originalMode: "LCL",
      reassignedMode: "LCL",
      notes: "Route optimization",
      status: "review",
      costImpact: -150,
      reason: "Route change",
      date: "2024-01-18"
    },
    {
      id: "5",
      shipmentId: "SHP-2024-005",
      originalMode: "FCL",
      reassignedMode: "LCL",
      notes: "Exception: Container availability issue",
      status: "exception",
      costImpact: 300,
      reason: "Container shortage",
      date: "2024-01-19"
    }
  ]);

  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const filteredData = data.filter(item => {
    const matchesSearch = item.shipmentId.toLowerCase().includes(globalFilter.toLowerCase()) ||
                         item.reason.toLowerCase().includes(globalFilter.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
  });

  const handleMarkForReview = (id: string) => {
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, status: "review" as const } : item
    ));
    toast.success("Marked for review");
  };

  const handleExportUnassigned = () => {
    const unassigned = data.filter(item => item.status === "exception");
    toast.success(`Exporting ${unassigned.length} unassigned shipments`);
  };

  const getSummaryStats = () => {
    const total = data.length;
    const completed = data.filter(item => item.status === "completed").length;
    const pending = data.filter(item => item.status === "pending").length;
    const review = data.filter(item => item.status === "review").length;
    const exceptions = data.filter(item => item.status === "exception").length;
    const totalCostImpact = data.reduce((sum, item) => sum + item.costImpact, 0);

    return { total, completed, pending, review, exceptions, totalCostImpact };
  };

  const stats = getSummaryStats();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Repositioning Summary</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review mode reassignments and handle exceptions
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Changes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
            </div>
            <TimeIcon className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Review</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.review}</p>
            </div>
            <AlertIcon className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Exceptions</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.exceptions}</p>
            </div>
            <AlertIcon className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cost Impact</p>
              <p className={`text-2xl font-bold ${
                stats.totalCostImpact > 0 
                  ? "text-red-600 dark:text-red-400" 
                  : "text-green-600 dark:text-green-400"
              }`}>
                {stats.totalCostImpact > 0 ? "+" : ""}${Math.abs(stats.totalCostImpact).toLocaleString()}
              </p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search shipments..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="review">Review</option>
            <option value="exception">Exception</option>
          </select>
          <Button onClick={handleExportUnassigned} size="sm" variant="outline">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export Unassigned
          </Button>
        </div>
      </div>

      {/* Repositioning Table */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              ))}
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    row.original.status === "exception" ? "bg-red-50 dark:bg-red-900/20" : ""
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {row.original.status === "pending" && (
                      <Button
                        onClick={() => handleMarkForReview(row.original.id)}
                        size="sm"
                        variant="outline"
                      >
                        Mark for Review
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No repositioning data found matching your criteria.
        </div>
      )}

      {/* Exception Handling Info */}
      {stats.exceptions > 0 && (
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <AlertIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Exception Handling Required
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {stats.exceptions} shipment(s) have exceptions that require attention. 
                Review the details and take appropriate action.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withUserAuth(UserRepositioningSummaryPage); 