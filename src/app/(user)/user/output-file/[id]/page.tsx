"use client";

import { withUserAuth } from "@/components/auth/withAuth";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { ArrowLeftIcon, DownloadIcon, FileIcon, CheckCircleIcon } from "@/icons";
import { getUploadedFiles } from "@/utils/clientShipmentService";
import { formatFileSize } from "@/utils/formatUtils";

function UserOutputFileViewerPage() {
  const params = useParams();
  const router = useRouter();
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadFile();
    }
  }, [params.id]);

  const loadFile = () => {
    try {
      setLoading(true);
      const files = getUploadedFiles();
      const foundFile = files.find((f: any) => f.id === params.id);
      
      if (foundFile) {
        setFile(foundFile);
      } else {
        console.error('File not found');
      }
    } catch (error) {
      console.error('Error loading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    router.back();
  };

  const downloadFile = () => {
    if (file) {
      // In a real app, this would download the processed output file
      // For now, we'll show a message
      alert('Output file download functionality would be implemented here');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading file...</p>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">File not found</p>
          <Button onClick={goBack} className="mt-4">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Check if file has successful processing
  if (!file.validRows || file.invalidRows > 0) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 max-w-md mx-auto">
            <CheckCircleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Output File Not Available
            </h2>
            <p className="text-red-600 dark:text-red-300 mb-4">
              This file does not have a successful processing status. Output files are only available for successfully processed files.
            </p>
            <Button onClick={goBack} variant="outline">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button onClick={goBack} variant="outline" size="sm">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Output File Viewer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Viewing processed output for: {file.originalName}
          </p>
        </div>
      </div>

      {/* Success Status */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-200 font-medium">
            File successfully processed
          </span>
        </div>
      </div>

      {/* File Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FileIcon className="w-8 h-8 text-green-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {file.originalName.replace('.xlsx', '')}_processed.xlsx
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Original File
            </label>
            <p className="text-sm text-gray-900 dark:text-white">
              {file.originalName}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Processing Date
            </label>
            <p className="text-sm text-gray-900 dark:text-white">
              {new Date(file.uploadDate).toLocaleString()}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total Records Processed
            </label>
            <p className="text-sm text-gray-900 dark:text-white">
              {file.totalRows || 0}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valid Records
            </label>
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              {file.validRows || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={downloadFile} variant="outline">
          <DownloadIcon className="w-4 h-4 mr-2" />
          Download Output File
        </Button>
      </div>

      {/* File Preview Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Processed File Preview
        </h3>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-8 text-center">
          <FileIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <p className="text-green-600 dark:text-green-400 mb-2">
            File successfully processed and validated
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            Use the download button to access the processed output file.
          </p>
        </div>
      </div>
    </div>
  );
}

export default withUserAuth(UserOutputFileViewerPage);
