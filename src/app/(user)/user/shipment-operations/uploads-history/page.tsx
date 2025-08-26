"use client";

import { withRouteAuth } from "@/components/auth/withAuth";
import Button from "@/components/ui/button/Button";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  UserIcon
} from "@/icons";
import { getUploadedFiles } from "@/utils/clientShipmentService";
import { formatFileSize } from "@/utils/formatUtils";
import { type UploadedFile, type ValidationError } from "@/utils/localStorageService";
import { ExcelViewerModal } from "@/components/ui/ExcelViewerModal";
import { getAssignmentResultByFileId, generateAssignmentResultsExcel } from "@/utils/assignmentResultsService";

interface ExtendedUploadedFile extends UploadedFile {
  userId?: string;
  status?: string;
  hasOutputFile?: boolean;
  outputFileName?: string;
}

interface UploadHistory {
  id: string;
  userId: string;
  userName: string;
  originalName: string;
  uploadDate: string;
  fileSize: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  status: "SUCCESS" | "FAILED" | "PENDING" | "PROCESSING";
  errors?: ValidationError[];
  warnings?: ValidationError[];
  hasOutputFile?: boolean;
  outputFileName?: string;
}

// Mock users for demonstration - in real app, this would come from API
const mockUsers = [
  { id: "user1", name: "John Doe" },
  { id: "user2", name: "Jane Smith" },
  { id: "user3", name: "Bob Johnson" },
  { id: "user4", name: "Alice Brown" },
  { id: "user5", name: "Charlie Wilson" },
];

function UploadsHistoryPage() {
  const router = useRouter();
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [excelModal, setExcelModal] = useState<{
    isOpen: boolean;
    fileContent: string;
    fileName: string;
  }>({
    isOpen: false,
    fileContent: '',
    fileName: ''
  });

  // Load upload history on component mount
  useEffect(() => {
    loadUploadHistory();
  }, []);

  const loadUploadHistory = () => {
    try {
      setLoading(true);
      const files = getUploadedFiles();
      
      // Transform files to UploadHistory format
      const history = files.map((file: ExtendedUploadedFile) => {
        const userId = file.userId || 'unknown';
        const user = mockUsers.find(u => u.id === userId) || { id: userId, name: 'Unknown User' };
        
        return {
          id: file.id,
          userId: userId,
          userName: user.name,
          originalName: file.originalName,
          uploadDate: file.uploadDate,
          fileSize: file.fileSize,
          totalRows: file.totalRows || 0,
          validRows: file.validRows || 0,
          invalidRows: file.invalidRows || 0,
          status: (file.status as "SUCCESS" | "FAILED" | "PENDING" | "PROCESSING") || 'PENDING',
          errors: file.errors || [],
          warnings: file.warnings || [],
          hasOutputFile: file.hasOutputFile || false,
          outputFileName: file.outputFileName || '',
        };
      });

      setUploadHistory(history);
    } catch (error) {
      console.error('Error loading upload history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = (file: UploadHistory) => {
    // In a real app, you would fetch the file content from the server
    // For now, we'll show a mock Excel content
    const mockExcelContent = `
      File: ${file.originalName}
      Upload Date: ${file.uploadDate}
      Total Rows: ${file.totalRows}
      Valid Rows: ${file.validRows}
      Invalid Rows: ${file.invalidRows}
      Status: ${file.status}
      
      This is a mock Excel file content. In a real application, 
      this would display the actual Excel file data.
    `;
    
    setExcelModal({
      isOpen: true,
      fileContent: mockExcelContent,
      fileName: file.originalName
    });
  };

  const handleDownloadOutput = async (file: UploadHistory) => {
    try {
      if (file.hasOutputFile && file.outputFileName) {
        // Get assignment results for this file
        const assignmentResults = getAssignmentResultByFileId(file.id);
        if (assignmentResults) {
          // Generate assignment results Excel file
          await generateAssignmentResultsExcel(assignmentResults, file.outputFileName);
        }
      }
    } catch (error) {
      console.error('Error downloading output file:', error);
    }
  };

  const handleRefresh = () => {
    loadUploadHistory();
  };

  const filteredData = useMemo(() => {
    let filtered = uploadHistory;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Apply user filter
    if (selectedUser !== "all") {
      filtered = filtered.filter(item => item.userId === selectedUser);
    }

    // Apply global search
    if (globalFilter) {
      filtered = filtered.filter(item =>
        item.originalName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.userName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.status.toLowerCase().includes(globalFilter.toLowerCase())
      );
    }

    return filtered;
  }, [uploadHistory, statusFilter, selectedUser, globalFilter]);

  const tableData = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, pagination.pageIndex, pagination.pageSize]);

  const totalPages = Math.ceil(filteredData.length / pagination.pageSize);

  // Table headers
  const tableHeaders = [
    "File Name",
    "Uploaded By", 
    "Upload Date",
    "File Size",
    "Total Rows",
    "Valid Rows",
    "Invalid Rows",
    "Status",
    "Actions"
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Uploads History
          </h1>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshIcon className="w-4 h-4" />
            Refresh
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage all uploaded shipment files and their processing status
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search files, users, or status..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-4">
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[
              { value: "all", label: "All Status" },
              { value: "SUCCESS", label: "Success" },
              { value: "FAILED", label: "Failed" },
              { value: "PENDING", label: "Pending" },
              { value: "PROCESSING", label: "Processing" }
            ]}
            className="min-w-[150px]"
          />
          <Select
            value={selectedUser}
            onChange={(value) => setSelectedUser(value)}
            options={[
              { value: "all", label: "All Users" },
              ...mockUsers.map(user => ({ value: user.id, label: user.name }))
            ]}
            className="min-w-[150px]"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Files</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{uploadHistory.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Successful</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {uploadHistory.filter(f => f.status === 'SUCCESS').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Failed</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {uploadHistory.filter(f => f.status === 'FAILED').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Processing</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {uploadHistory.filter(f => f.status === 'PROCESSING').length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {tableHeaders.map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tableData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <FileIcon className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {row.originalName}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {row.userName}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {new Date(row.uploadDate).toLocaleDateString()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatFileSize(row.fileSize)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {row.totalRows.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {row.validRows.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {row.invalidRows.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const status = row.status;
                      const getStatusIcon = () => {
                        switch (status) {
                          case "SUCCESS":
                            return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
                          case "FAILED":
                            return <XCircleIcon className="w-4 h-4 text-red-500" />;
                          case "PROCESSING":
                            return <RefreshIcon className="w-4 h-4 text-blue-500 animate-spin" />;
                          default:
                            return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
                        }
                      };

                      const getStatusColor = () => {
                        switch (status) {
                          case "SUCCESS":
                            return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
                          case "FAILED":
                            return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
                          case "PROCESSING":
                            return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
                          default:
                            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
                        }
                      };

                      return (
                        <>
                          {getStatusIcon()}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
                            {status}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewFile(row)}
                      className="p-1"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                    {row.hasOutputFile && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadOutput(row)}
                        className="p-1"
                      >
                        <DownloadIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {pagination.pageIndex * pagination.pageSize + 1} to{" "}
            {Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredData.length)} of{" "}
            {filteredData.length} results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex - 1 }))}
              disabled={pagination.pageIndex === 0}
            >
              Previous
            </Button>
            <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
              Page {pagination.pageIndex + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
              disabled={pagination.pageIndex >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {filteredData.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {loading ? "Loading upload history..." : "No uploads found matching your criteria."}
        </div>
      )}

      {/* Excel Viewer Modal */}
      <ExcelViewerModal
        isOpen={excelModal.isOpen}
        onClose={() => setExcelModal({ isOpen: false, fileContent: '', fileName: '' })}
        fileContent={excelModal.fileContent}
        fileName={excelModal.fileName}
      />
    </div>
  );
}

export default withRouteAuth(UploadsHistoryPage, "user/shipment-operations/uploads-history");
