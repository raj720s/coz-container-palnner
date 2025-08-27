"use client";

import { withSimpleRBAC } from "@/components/auth/withSimpleRBAC";
import Button from "@/components/ui/button/Button";
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
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface ValidationError {
  id: string;
  rowNumber: number;
  field: string;
  errorMessage: string;
  value: string;
  severity: "error" | "warning";
}

interface ValidationSummary {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: ValidationError[];
  fileName?: string;
  uploadDate?: string;
  fileSize?: number;
  storedFileName?: string;
}

const columnHelper = createColumnHelper<ValidationError>();

const columns: ColumnDef<ValidationError>[] = [
  {
    accessorKey: "rowNumber",
    header: "Row #",
    cell: (info) => <span>{info.getValue() as number}</span>,
  },
  {
    accessorKey: "field",
    header: "Field",
    cell: (info) => <span>{info.getValue() as string}</span>,
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: (info) => (
      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded dark:bg-gray-700">
        {info.getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "errorMessage",
    header: "Error Message",
    cell: (info) => <span>{info.getValue() as string}</span>,
  },
  {
    accessorKey: "severity",
    header: "Severity",
    cell: (info) => (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          (info.getValue() as string) === "error"
            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        }`}
      >
        {info.getValue() as string}
      </span>
    ),
  },
];

function ValidationSummaryPage() {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  console.log('ValidationSummaryPage: Component rendering');

  // Get validation data from session storage or use mock data
  const getValidationSummary = (): ValidationSummary => {
    console.log('ValidationSummaryPage: Getting validation summary');
    try {
      const storedData = sessionStorage.getItem('validationResult');
      console.log('ValidationSummaryPage: Stored data:', storedData);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        console.log('ValidationSummaryPage: Parsed data:', parsed);
        return {
          totalRecords: parsed.totalRecords,
          validRecords: parsed.validRecords,
          invalidRecords: parsed.invalidRecords,
          errors: parsed.errors || [],
          fileName: parsed.fileName,
          uploadDate: parsed.uploadDate,
          fileSize: parsed.fileSize,
          storedFileName: parsed.storedFileName,
        };
      }
    } catch (error) {
      console.error('ValidationSummaryPage: Error parsing stored data:', error);
    }

    // Return mock data if no stored data
    console.log('ValidationSummaryPage: Using mock data');
    return {
      totalRecords: 150,
      validRecords: 142,
      invalidRecords: 8,
      errors: [
        {
          id: "1",
          rowNumber: 23,
          field: "Destination Port",
          errorMessage: "Invalid port code format",
          value: "INVALID_PORT",
          severity: "error",
        },
        {
          id: "2",
          rowNumber: 45,
          field: "Container Type",
          errorMessage: "Container type not supported",
          value: "50FT",
          severity: "error",
        },
        {
          id: "3",
          rowNumber: 67,
          field: "Weight",
          errorMessage: "Weight exceeds maximum limit",
          value: "35000",
          severity: "error",
        },
        {
          id: "4",
          rowNumber: 89,
          field: "Volume",
          errorMessage: "Volume calculation mismatch",
          value: "75.5",
          severity: "warning",
        },
        {
          id: "5",
          rowNumber: 112,
          field: "Customer Code",
          errorMessage: "Customer code not found in system",
          value: "CUST999",
          severity: "error",
        },
        {
          id: "6",
          rowNumber: 134,
          field: "Priority",
          errorMessage: "Priority level out of range",
          value: "15",
          severity: "warning",
        },
        {
          id: "7",
          rowNumber: 145,
          field: "Delivery Date",
          errorMessage: "Delivery date in the past",
          value: "2023-12-01",
          severity: "error",
        },
        {
          id: "8",
          rowNumber: 148,
          field: "Special Requirements",
          errorMessage: "Special characters not allowed",
          value: "Refrigerated@",
          severity: "warning",
        },
      ],
      fileName: "shipments_2024.xlsx",
      uploadDate: new Date().toISOString(),
      fileSize: 2048576,
    };
  };

  const validationSummary = getValidationSummary();
  console.log('ValidationSummaryPage: Validation summary:', validationSummary);

  const table = useReactTable({
    data: validationSummary.errors,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
  });

  const handleProceedToPlanning = () => {
    // Check if there are any critical errors
    const hasErrors = validationSummary.errors.some(error => error.severity === 'error');
    
    if (hasErrors) {
      toast.error('Please fix all errors before proceeding to container planning');
      return;
    }

    // Navigate to container planning
    router.push('/user/container-planning');
  };

  const handleReupload = () => {
    // Clear session storage and go back to upload
    sessionStorage.removeItem('validationResult');
    sessionStorage.removeItem('validShipments');
    router.push('/user/shipment-upload');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const errorCount = validationSummary.errors.filter(e => e.severity === 'error').length;
  const warningCount = validationSummary.errors.filter(e => e.severity === 'warning').length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Validation Summary
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review validation results and errors before proceeding to container planning
        </p>
      </div>

      {/* File Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">File Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">File Name</label>
            <p className="text-sm text-gray-900 dark:text-white">{validationSummary.fileName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Upload Date</label>
            <p className="text-sm text-gray-900 dark:text-white">
              {validationSummary.uploadDate ? formatDate(validationSummary.uploadDate) : 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">File Size</label>
            <p className="text-sm text-gray-900 dark:text-white">
              {validationSummary.fileSize ? formatFileSize(validationSummary.fileSize) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Validation Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Records</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{validationSummary.totalRecords}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Valid Records</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{validationSummary.validRecords}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Errors</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{errorCount}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Warnings</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{warningCount}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Button
          onClick={handleProceedToPlanning}
          disabled={errorCount > 0}
          className="flex items-center gap-2"
        >
          Proceed to Container Planning
        </Button>
        <Button
          onClick={handleReupload}
          variant="outline"
          className="flex items-center gap-2"
        >
          Re-upload File
        </Button>
      </div>

      {/* Error Details */}
      {validationSummary.errors.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Validation Errors & Warnings ({validationSummary.errors.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
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
      )}

      {/* No Errors Message */}
      {validationSummary.errors.length === 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
          <div className="text-green-800 dark:text-green-200">
            <div className="text-lg font-medium mb-2">✅ All Records Validated Successfully!</div>
            <p>No validation errors or warnings found. You can proceed to container planning.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default withSimpleRBAC(ValidationSummaryPage, {
  module: "shipment-operations",
  route: "/user/validation-summary",
}); 