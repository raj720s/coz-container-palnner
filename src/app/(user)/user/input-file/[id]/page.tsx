"use client";

import { withUserAuth } from "@/components/auth/withAuth";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { ArrowLeftIcon, DownloadIcon, FileIcon } from "@/icons";
import { getUploadedFiles } from "@/utils/clientShipmentService";
import { formatFileSize } from "@/utils/formatUtils";
import { type UploadedFile } from "@/utils/localStorageService";

function UserInputFileViewerPage() {
  const params = useParams();
  const router = useRouter();
  const [file, setFile] = useState<UploadedFile | null>(null);
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
      const foundFile = files.find((f: UploadedFile) => f.id === params.id);
      
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
    if (file && file.fileContent) {
      // Convert base64 to blob and download
      const byteCharacters = atob(file.fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      a.click();
      window.URL.revokeObjectURL(url);
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
            Input File Viewer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Viewing uploaded file: {file.originalName}
          </p>
        </div>
      </div>

      {/* File Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FileIcon className="w-8 h-8 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {file.originalName}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              File Size
            </label>
            <p className="text-sm text-gray-900 dark:text-white">
              {formatFileSize(file.fileSize)}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Upload Date
            </label>
            <p className="text-sm text-gray-900 dark:text-white">
              {new Date(file.uploadDate).toLocaleString()}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total Records
            </label>
            <p className="text-sm text-gray-900 dark:text-white">
              {file.totalRows || 0}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valid Records
            </label>
            <p className="text-sm text-gray-900 dark:text-white">
              {file.validRows || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={downloadFile} variant="outline">
          <DownloadIcon className="w-4 h-4 mr-2" />
          Download File
        </Button>
      </div>

      {/* File Preview Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          File Preview
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
          <FileIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            File preview not available. Use the download button to access the file.
          </p>
        </div>
      </div>
    </div>
  );
}

export default withUserAuth(UserInputFileViewerPage);
