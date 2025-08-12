"use client";

import { withUserAuth } from "@/components/auth/withAuth";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, getSortedRowModel, getFilteredRowModel, SortingState } from "@tanstack/react-table";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { DownloadIcon, AlertIcon, CheckCircleIcon, TimeIcon } from "@/icons";

interface ValidationError {
  id: string;
  row: number;
  field: string;
  message: string;
  severity: "error" | "warning" | "info";
  value?: string;
  expected?: string;
}

interface ValidationSummary {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  warnings: number;
  errors: number;
}

const columnHelper = createColumnHelper<ValidationError>();

function UserValidationSummaryPage() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  // Mock data - in real app, this would come from session storage or API
  const data: ValidationError[] = useMemo(() => [
    {
      id: "1",
      row: 12,
      field: "CBM",
      message: "Invalid CBM value - must be between 0.1 and 100",
      severity: "error",
      value: "150.5",
      expected: "0.1 - 100"
    },
    {
      id: "2",
      row: 23,
      field: "Customer",
      message: "Customer not found in master data",
      severity: "error",
      value: "Unknown Corp",
      expected: "Valid customer code"
    },
    {
      id: "3",
      row: 31,
      field: "POL",
      message: "Port of Loading is required",
      severity: "error",
      value: "",
      expected: "Valid port code"
    },
    {
      id: "4",
      row: 15,
      field: "Qty",
      message: "Quantity should be a positive integer",
      severity: "warning",
      value: "-5",
      expected: "Positive integer"
    },
    {
      id: "5",
      row: 42,
      field: "POD",
      message: "Port of Destination format is incorrect",
      severity: "warning",
      value: "LA",
      expected: "Full port name"
    },
    {
      id: "6",
      row: 8,
      field: "Shipment ID",
      message: "Duplicate shipment ID found",
      severity: "error",
      value: "SHP-2024-001",
      expected: "Unique shipment ID"
    },
    {
      id: "7",
      row: 19,
      field: "Description",
      message: "Description is too long",
      severity: "info",
      value: "Very long description that exceeds the maximum allowed length",
      expected: "Max 100 characters"
    }
  ], []);

  // Define columns with memoization to prevent infinite re-renders
  const columns = useMemo(() => [
    columnHelper.accessor("row", {
      header: "Row",
      cell: (info) => (
        <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("field", {
      header: "Field",
      cell: (info) => (
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("message", {
      header: "Error Message",
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("value", {
      header: "Current Value",
      cell: (info) => (
        <span className="text-sm text-gray-500 dark:text-gray-500 font-mono">
          {info.getValue() || "-"}
        </span>
      ),
    }),
    columnHelper.accessor("expected", {
      header: "Expected",
      cell: (info) => (
        <span className="text-sm text-gray-500 dark:text-gray-500 font-mono">
          {info.getValue() || "-"}
        </span>
      ),
    }),
    columnHelper.accessor("severity", {
      header: "Severity",
      cell: (info) => {
        const severity = info.getValue();
        const severityConfig = {
          error: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: AlertIcon },
          warning: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: AlertIcon },
          info: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: TimeIcon }
        };
        const config = severityConfig[severity];
        const Icon = config.icon;
        return (
          <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${config.color}`}>
            <Icon className="w-3 h-3" />
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
          </span>
        );
      },
    }),
  ], []);

  // Filter data with memoization
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch =
        item.field.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.message.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.value?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.expected?.toLowerCase().includes(globalFilter.toLowerCase());

      const matchesSeverity = severityFilter === "all" || item.severity === severityFilter;

      return matchesSearch && matchesSeverity;
    });
  }, [data, globalFilter, severityFilter]);

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

  const handleDownloadReport = () => {
    const headers = ["Row", "Field", "Error Message", "Current Value", "Expected", "Severity"];
    
    const csvContent = [
      headers.join(","),
      ...filteredData.map(row => [
        row.row,
        row.field,
        `"${row.message}"`,
        row.value || "",
        row.expected || "",
        row.severity
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "validation_errors.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Validation report downloaded successfully");
  };

  const handleClearAndReupload = () => {
    // Clear session storage and redirect to upload
    sessionStorage.removeItem('validationResult');
    window.location.href = '/user/shipment-upload';
  };

  const handleProceed = () => {
    // Check if there are any errors (not just warnings/info)
    const hasErrors = filteredData.some(item => item.severity === "error");
    if (hasErrors) {
      toast.error("Please fix all errors before proceeding");
      return;
    }
    
    toast.success("Proceeding to container planning");
    window.location.href = '/user/container-planning';
  };

  // Calculate summary stats with memoization
  const stats = useMemo(() => {
    const totalRecords = 50; // Mock total
    const validRecords = totalRecords - data.filter(item => item.severity === "error").length;
    const invalidRecords = data.filter(item => item.severity === "error").length;
    const warnings = data.filter(item => item.severity === "warning").length;
    const errors = data.filter(item => item.severity === "error").length;

    return { totalRecords, validRecords, invalidRecords, warnings, errors };
  }, [data]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Validation Summary
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review and fix validation errors in your shipment data
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRecords}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Records</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.validRecords}</div>
          <div className="text-sm text-green-600 dark:text-green-400">Valid Records</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.invalidRecords}</div>
          <div className="text-sm text-red-600 dark:text-red-400">Invalid Records</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.warnings}</div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400">Warnings</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.errors}</div>
          <div className="text-sm text-red-600 dark:text-red-400">Errors</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search errors by field, message, or value..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Severities</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="info">Info</option>
          </select>
          <Button onClick={handleDownloadReport} size="sm">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Validation Errors Table */}
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
                    row.original.severity === "error" ? "bg-red-50 dark:bg-red-900/20" : ""
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
          No validation errors found matching your filters.
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mt-6">
        <Button onClick={handleClearAndReupload} variant="outline">
          Clear & Re-upload
        </Button>
        <Button 
          onClick={handleProceed}
          disabled={stats.errors > 0}
        >
          <CheckCircleIcon className="w-4 h-4 mr-2" />
          Proceed to Planning
        </Button>
      </div>
    </div>
  );
}

export default withUserAuth(UserValidationSummaryPage); 