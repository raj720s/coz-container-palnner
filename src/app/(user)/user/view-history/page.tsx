"use client";

import { withUserAuth } from "@/components/auth/withAuth";
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
  PaginationState,
} from "@tanstack/react-table";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { 
  DownloadIcon, 
  EyeIcon, 
  RefreshIcon, 
  FileIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon
} from "@/icons";
import { getUploadedFiles } from "@/utils/clientShipmentService";
import { formatFileSize } from "@/utils/formatUtils";
import { useAuth } from "@/context/AuthContext";

interface UploadHistory {
  id: string;
  originalName: string;
  uploadDate: string;
  fileSize: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  status: "SUCCESS" | "FAILED" | "PENDING" | "PROCESSING";
  errors?: string[];
  warnings?: string[];
  hasOutputFile?: boolean;
  outputFileName?: string;
}

const columnHelper = createColumnHelper<UploadHistory>();

function UserViewHistoryPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Load upload history on component mount
  useEffect(() => {
    loadUploadHistory();
  }, []);

  const loadUploadHistory = () => {
    try {
      setLoading(true);
      const files = getUploadedFiles();
      
      // Transform the data to match our interface
      const historyData: UploadHistory[] = files.map((file: any) => {
        // Determine status based on validation results
        let status: UploadHistory['status'] = 'PENDING';
        if (file.validRows > 0 && file.invalidRows === 0) {
          status = 'SUCCESS';
        } else if (file.invalidRows > 0) {
          status = 'FAILED';
        } else if (file.validRows === 0 && file.invalidRows === 0) {
          status = 'PROCESSING';
        }

        return {
          id: file.id,
          originalName: file.originalName,
          uploadDate: file.uploadDate,
          fileSize: file.fileSize,
          totalRows: file.totalRows || 0,
          validRows: file.validRows || 0,
          invalidRows: file.invalidRows || 0,
          status,
          errors: file.errors || [],
          warnings: file.warnings || [],
          hasOutputFile: status === 'SUCCESS',
          outputFileName: status === 'SUCCESS' ? `${file.originalName.replace('.xlsx', '')}_processed.xlsx` : undefined
        };
      });

      // Filter to show only last 3 months of data
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const filteredByDate = historyData.filter(item => 
        new Date(item.uploadDate) >= threeMonthsAgo
      );

      // Filter to show only current user's records (in real app, this would come from file metadata)
      // For now, we'll show all records but this should be filtered by userId in production
      const userRecords = filteredByDate;

      // Limit to last 10 records per user
      const limitedRecords = userRecords.slice(0, 10);

      setUploadHistory(limitedRecords);
    } catch (error) {
      console.error('Error loading upload history:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor("originalName", { 
      header: "Input File Name", 
      cell: (info) => (
        <div className="flex items-center gap-2">
          <FileIcon className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-gray-900 dark:text-white">
            {info.getValue()}
          </span>
        </div>
      )
    }),
    columnHelper.accessor("uploadDate", { 
      header: "Upload Date", 
      cell: (info) => (
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {new Date(info.getValue()).toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </span>
        </div>
      )
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => {
        const status = info.getValue();
        const statusConfig = {
          SUCCESS: { 
            label: "SUCCESS", 
            className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
          },
          FAILED: { 
            label: "FAILED", 
            className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" 
          },
          PENDING: { 
            label: "PENDING", 
            className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" 
          },
          PROCESSING: { 
            label: "PROCESSING", 
            className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" 
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
    columnHelper.accessor("fileSize", { 
      header: "File Size", 
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {formatFileSize(info.getValue())}
        </span>
      )
    }),
    columnHelper.accessor("totalRows", { 
      header: "Total Records", 
      cell: (info) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.display({
      id: "downloadInput",
      header: "Download Input",
      cell: (info) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => viewInputFile(info.row.original)}
          className="p-1"
        >
          <EyeIcon className="w-4 h-4" />
          <span className="ml-1">View</span>
        </Button>
      ),
    }),
    columnHelper.display({
      id: "downloadOutput",
      header: "Download Output",
      cell: (info) => {
        const row = info.row.original;
        if (row.status === 'SUCCESS' && row.hasOutputFile) {
          return (
            <Button
              size="sm"
              variant="outline"
              onClick={() => viewOutputFile(row)}
              className="p-1"
            >
              <EyeIcon className="w-4 h-4" />
              <span className="ml-1">View</span>
            </Button>
          );
        } else {
          return (
            <span className="text-sm text-gray-400 dark:text-gray-500 italic">
              Not Available
            </span>
          );
        }
      },
    }),
  ], []);

  const filteredData = useMemo(() => {
    return uploadHistory.filter(item => {
      const matchesSearch =
        item.originalName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.status.toLowerCase().includes(globalFilter.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [uploadHistory, globalFilter, statusFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    pageCount: Math.ceil(filteredData.length / pagination.pageSize),
    manualPagination: true,
  });

  const viewInputFile = (upload: UploadHistory) => {
    // Navigate to input file viewer
    router.push(`/user/input-file/${upload.id}`);
  };

  const viewOutputFile = (upload: UploadHistory) => {
    // Navigate to output file viewer
    router.push(`/user/output-file/${upload.id}`);
  };

  const downloadFile = (upload: UploadHistory) => {
    // Implement file download logic
    console.log('Downloading file:', upload.originalName);
  };

  const exportHistory = () => {
    const headers = ["Input File Name", "Upload Date", "Status", "File Size", "Total Records", "Valid Records", "Invalid Records"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map(row => [
        row.originalName,
        new Date(row.uploadDate).toLocaleString(),
        row.status,
        formatFileSize(row.fileSize),
        row.totalRows,
        row.validRows,
        row.invalidRows
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my_upload_history.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setGlobalFilter("");
    setStatusFilter("all");
    setPagination({ pageIndex: 0, pageSize: 10 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading upload history...</p>
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
            My Upload History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View your shipment file uploads and processing results. Shows last 10 upload records from the past 3 months.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportHistory} size="sm" variant="outline">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={loadUploadHistory} size="sm" variant="outline">
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
              <FileIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Uploads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{uploadHistory.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Successful</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {uploadHistory.filter(item => item.status === 'SUCCESS').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {uploadHistory.filter(item => item.status === 'FAILED').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {uploadHistory.filter(item => item.status === 'PENDING').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <Input
              placeholder="Search by file name or status..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status Filter
            </label>
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "SUCCESS", label: "SUCCESS" },
                { value: "FAILED", label: "FAILED" },
                { value: "PENDING", label: "PENDING" },
                { value: "PROCESSING", label: "PROCESSING" }
              ]}
              className="w-full"
            />
          </div>
          
          <div className="flex items-end">
            <Button onClick={resetFilters} size="sm" variant="outline" className="w-full">
              Reset Filters
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

        {/* Pagination */}
        <div className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              size="sm"
              variant="outline"
            >
              Previous
            </Button>
            <Button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              size="sm"
              variant="outline"
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div className="flex gap-x-2 items-baseline">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> of{" "}
                <span className="font-medium">{table.getPageCount()}</span>
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Showing{" "}
                <span className="font-medium">
                  {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    filteredData.length
                  )}
                </span>{" "}
                of <span className="font-medium">{filteredData.length}</span> results
              </span>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  size="sm"
                  variant="outline"
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  size="sm"
                  variant="outline"
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {uploadHistory.length === 0 
            ? "No upload history found. Upload your first shipment file to get started."
            : "No uploads match your search criteria."
          }
        </div>
      )}
    </div>
  );
}

export default withUserAuth(UserViewHistoryPage);
