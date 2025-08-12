"use client";

import { withUserAuth } from "@/components/auth/withAuth";
import Button from "@/components/ui/button/Button";
import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { DownloadIcon, EyeIcon, TrashBinIcon, PlusIcon } from "@/icons";
import { processExcelFile, getUploadedFiles } from "@/utils/clientShipmentService";
import { localStorageService } from '@/utils/localStorageService';

interface UploadHistory {
  id: string;
  fileName: string;
  uploadDate: string;
  fileSize: number;
  status: "completed" | "processing" | "error";
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  planningResult?: {
    totalShipments: number;
    assignedShipments: number;
    unassignedShipments: number;
    totalContainers: number;
    averageUtilization: number;
  };
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

function UserShipmentUploadPage() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const router = useRouter();

  // Load upload history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('userUploadHistory');
    if (savedHistory) {
      setUploadHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save upload history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('userUploadHistory', JSON.stringify(uploadHistory));
  }, [uploadHistory]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newProgress: UploadProgress[] = acceptedFiles.map((file) => ({
      fileName: file.name,
      progress: 0,
      status: "uploading",
    }));

    setUploadProgress(newProgress);
    setIsUploading(true);

    // Process each file
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      
      try {
        // Check for duplicate file names
        const isDuplicate = uploadHistory.some(history => history.fileName === file.name);
        if (isDuplicate) {
          throw new Error(`File "${file.name}" already exists. Please rename the file and try again.`);
        }

        // Update progress
        setUploadProgress((prev) =>
          prev.map((item, index) =>
            index === i
              ? { ...item, progress: 25, status: "uploading" }
              : item
          )
        );

        // Process file client-side
        const result = await processExcelFile(file, (progress) => {
          setUploadProgress((prev) =>
            prev.map((item, index) =>
              index === i
                ? { ...item, progress: progress.progress, status: progress.status === "completed" ? "completed" : "uploading" }
                : item
            )
          );
        });

        // Update progress to completed
        setUploadProgress((prev) =>
          prev.map((item, index) =>
            index === i
              ? { ...item, progress: 100, status: "completed" }
              : item
          )
        );

        // Store validation result in session storage for next page
        sessionStorage.setItem('validationResult', JSON.stringify(result));

        // Upload history is now managed by localStorage service automatically
        // Refresh upload history from localStorage
        const files = getUploadedFiles();
        const historyData = files.slice(0, 10).map((file: any) => ({
          id: file.id,
          fileName: file.originalName,
          uploadDate: file.uploadDate,
          fileSize: file.fileSize,
          status: "completed" as const,
          totalRecords: file.totalRows || 0,
          validRecords: file.validRows || 0,
          invalidRecords: file.invalidRows || 0,
        }));
        setUploadHistory(historyData);

        toast.success(`${file.name} uploaded successfully!`);
        
      } catch (error) {
        console.error('Upload error:', error);
        
        // Update progress to error
        setUploadProgress((prev) =>
          prev.map((item, index) =>
            index === i
              ? { 
                  ...item, 
                  progress: 100, 
                  status: "error",
                  error: error instanceof Error ? error.message : 'Upload failed'
                }
              : item
          )
        );

        toast.error(`${file.name} upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setIsUploading(false);
  }, [uploadHistory]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: true,
  });

  const downloadTemplate = () => {
    const template = `SHIPMENT,CUSTOME,SUPPLIER,VOLUME,Qty,RCV/PUG,POL,Destsite
HL3025608,OTTO GME,HUI ZHOU,7.49,78,14/7/2025,Yantian,HALDENSLEBEN
QL3025645,BON PRIX,HK TSO SI,1.104,8003,17/7/2025,Qingdao,Haldensleben
QL30257883,ABC Corp,QINGDAO,16.2,9977,21/7/2022,Yantian,Peine`;
    
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shipment_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Excel template downloaded successfully. Import the CSV into Excel for proper formatting.");
  };

  const handleUpload = () => {
    if (uploadProgress.some(p => p.status === "completed")) {
      router.push('/user/container-planning');
    } else {
      toast.error("Please complete the upload process first");
    }
  };

  const viewHistory = (history: UploadHistory) => {
    // In a real app, this would fetch and display the detailed results
    toast(`Viewing details for ${history.fileName}`);
  };

  const deleteHistory = (id: string) => {
    if (confirm("Are you sure you want to delete this upload record?")) {
      setUploadHistory(prev => prev.filter(item => item.id !== id));
      toast.success("Upload record deleted");
    }
  };

  const downloadResults = (history: UploadHistory) => {
    // In a real app, this would generate and download the planning results
    toast(`Downloading results for ${history.fileName}`);
  };

  const getStatusColor = (status: UploadHistory["status"]) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
      case "processing": return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20";
      case "error": return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
      default: return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Add debug and refresh functions
  const refreshLocalStorage = () => {
    console.log('🔄 Manual localStorage refresh requested (User)');
    
    // Clear all localStorage data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('nxt_admin_')) {
        console.log(`🗑️ Removing: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    // Reinitialize
    localStorageService.init();
    
    // Log current state
    const polPorts = localStorageService.getPOLPorts();
    console.log('📊 Current POL ports:', polPorts.length);
    console.log('🏗️ Available POL ports:', polPorts.map(p => p.name).join(', '));
    
    toast.success(`LocalStorage refreshed! Available POL ports: ${polPorts.map(p => p.name).join(', ')}`);
  };

  const debugLocalStorage = () => {
    const polPorts = localStorageService.getPOLPorts();
    const podPorts = localStorageService.getPODPorts();
    const priorities = localStorageService.getContainerPriorities();
    console.log('🔍 Current localStorage state (User):');
    console.log('POL Ports:', polPorts.length, polPorts.map(p => p.name));
    console.log('POD Ports:', podPorts.length, podPorts.map(p => p.name));
    console.log('Container Priorities:', priorities.length, priorities.map(p => p.containerType));
    toast.success(`POL: ${polPorts.length}, POD: ${podPorts.length}, Priorities: ${priorities.length}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Shipment Upload
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload Excel files containing shipment data for container load planning. Only Excel files (.xlsx, .xls) are supported.
        </p>
        <div className="flex gap-2 mt-4">
          <button
            onClick={refreshLocalStorage}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            🔄 Refresh Master Data
          </button>
          <button
            onClick={debugLocalStorage}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            🔍 Debug State
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div className="mb-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="text-6xl">📁</div>
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {isDragActive ? "Drop files here" : "Drag & drop files here"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                or click to select files
              </p>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Supports Excel (.xlsx, .xls) files up to 10MB
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Upload Progress
          </h3>
          <div className="space-y-3">
            {uploadProgress.map((progress, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {progress.fileName}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    progress.status === "completed" ? "text-green-600 bg-green-100" :
                    progress.status === "error" ? "text-red-600 bg-red-100" :
                    "text-yellow-600 bg-yellow-100"
                  }`}>
                    {progress.status}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progress.status === "completed" ? "bg-green-500" :
                      progress.status === "error" ? "bg-red-500" :
                      "bg-yellow-500"
                    }`}
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                {progress.error && (
                  <p className="text-xs text-red-600 mt-1">{progress.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Button onClick={downloadTemplate} variant="outline">
          <DownloadIcon className="w-4 h-4 mr-2" />
          Download Template
        </Button>
        <Button 
          onClick={handleUpload}
          disabled={!uploadProgress.some(p => p.status === "completed")}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Start Planning
        </Button>
        <Button 
          onClick={() => setShowHistory(!showHistory)}
          variant="outline"
        >
          <EyeIcon className="w-4 h-4 mr-2" />
          {showHistory ? "Hide" : "View"} History
        </Button>
      </div>

      {/* Upload History */}
      {showHistory && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Upload History (Last 10)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Records
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {uploadHistory.map((history) => (
                  <tr key={history.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {history.fileName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(history.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(history.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(history.status)}`}>
                        {history.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {history.validRecords}/{history.totalRecords}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewHistory(history)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadResults(history)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          <DownloadIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteHistory(history.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <TrashBinIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {uploadHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No upload history found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default withUserAuth(UserShipmentUploadPage); 