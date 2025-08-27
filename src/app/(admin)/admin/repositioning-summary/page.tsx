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
  ColumnDef,
} from "@tanstack/react-table";
import Input from "@/components/form/input/InputField";
import { DownloadIcon } from "@/icons";

interface RepositioningSummary {
  id: string;
  shipmentId: string;
  originalMode: "FCL" | "LCL";
  reassignedMode: "FCL" | "LCL";
  newContainerRef: string;
  notes: string;
  status: "completed" | "pending" | "review";
  createdAt: string;
}

const columnHelper = createColumnHelper<RepositioningSummary>();

function RepositioningSummaryPage() {
  const [data, setData] = useState<RepositioningSummary[]>([
    {
      id: "1",
      shipmentId: "SHP-2024-001",
      originalMode: "LCL",
      reassignedMode: "FCL",
      newContainerRef: "CONT-40HC-001",
      notes: "Volume increased, upgraded to FCL for cost efficiency",
      status: "completed",
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      shipmentId: "SHP-2024-002",
      originalMode: "FCL",
      reassignedMode: "LCL",
      newContainerRef: "",
      notes: "Volume decreased, downgraded to LCL",
      status: "pending",
      createdAt: "2024-01-15",
    },
    {
      id: "3",
      shipmentId: "SHP-2024-003",
      originalMode: "FCL",
      reassignedMode: "FCL",
      newContainerRef: "CONT-20FT-002",
      notes: "Container type changed for better fit",
      status: "review",
      createdAt: "2024-01-15",
    },
    {
      id: "4",
      shipmentId: "SHP-2024-004",
      originalMode: "LCL",
      reassignedMode: "LCL",
      newContainerRef: "",
      notes: "No change required",
      status: "completed",
      createdAt: "2024-01-15",
    },
  ]);

  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const handleMarkForReview = (id: string) => {
    setData(prev => prev.map(item =>
      item.id === id
        ? { ...item, status: "review" as const }
        : item
    ));
    toast.success("Marked for review");
  };

  // Define columns inside the component to access the handler functions
  const columns = useMemo(() => [
    columnHelper.accessor("shipmentId", { 
      header: "Shipment ID", 
      cell: (info) => <span className="font-mono text-sm">{info.getValue()}</span>
    }),
    columnHelper.accessor("originalMode", {
      header: "Original Mode",
      cell: (info) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          info.getValue() === "FCL"
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
            : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
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
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
            : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
        }`}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("newContainerRef", { 
      header: "New Container Ref", 
      cell: (info) => (
        <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
          {info.getValue() || "-"}
        </span>
      )
    }),
    columnHelper.accessor("notes", { 
      header: "Notes/Reasons", 
      cell: (info) => info.getValue() || "-"
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          info.getValue() === "completed"
            ? "bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300"
            : info.getValue() === "pending"
            ? "bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300"
            : "bg-info-100 text-info-700 dark:bg-info-900 dark:text-info-300"
        }`}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleMarkForReview(info.row.original.id)}
            className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Mark for Review
          </button>
        </div>
      ),
    }),
  ], [handleMarkForReview]);

  const filteredData = useMemo(() => data.filter(item => {
    const matchesSearch =
      item.shipmentId.toLowerCase().includes(globalFilter.toLowerCase()) ||
      item.newContainerRef.toLowerCase().includes(globalFilter.toLowerCase()) ||
      item.notes.toLowerCase().includes(globalFilter.toLowerCase());

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

  const exportUnassigned = () => {
    const unassignedData = data.filter(item => !item.newContainerRef);
    if (unassignedData.length === 0) {
      toast("No unassigned shipments to export");
      return;
    }

    const headers = [
      "Shipment ID", "Original Mode", "Reassigned Mode", "Notes"
    ];
    
    const csvContent = [
      headers.join(","),
      ...unassignedData.map(row => [
        row.shipmentId,
        row.originalMode,
        row.reassignedMode,
        row.notes
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "unassigned_shipments.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Unassigned shipments exported successfully");
  };

  const getSummaryStats = () => {
    const total = filteredData.length;
    const completed = filteredData.filter(item => item.status === "completed").length;
    const pending = filteredData.filter(item => item.status === "pending").length;
    const review = filteredData.filter(item => item.status === "review").length;
    const fclToLcl = filteredData.filter(item => item.originalMode === "FCL" && item.reassignedMode === "LCL").length;
    const lclToFcl = filteredData.filter(item => item.originalMode === "LCL" && item.reassignedMode === "FCL").length;

    return { total, completed, pending, review, fclToLcl, lclToFcl };
  };

  const stats = useMemo(() => getSummaryStats(), [filteredData]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Repositioning Summary
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage container mode reassignments and repositioning decisions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Shipments</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
          <div className="text-sm text-green-600 dark:text-green-400">Completed</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400">Pending</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.review}</div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Under Review</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.fclToLcl}</div>
          <div className="text-sm text-purple-600 dark:text-purple-400">FCL → LCL</div>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.lclToFcl}</div>
          <div className="text-sm text-indigo-600 dark:text-indigo-400">LCL → FCL</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search shipments, container refs, or notes..."
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
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="review">Under Review</option>
          </select>
          <Button onClick={exportUnassigned} size="sm" variant="outline">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export Unassigned
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
                    row.original.status === "review" ? "bg-blue-50 dark:bg-blue-900/20" : ""
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
          No repositioning data found matching your filters.
        </div>
      )}
    </div>
  );
}

export default withSimpleRBAC(RepositioningSummaryPage, {
  
  route: "/admin/repositioning-summary",
}); 