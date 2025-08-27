"use client";

import { withSimpleRBAC } from "@/components/auth/withSimpleRBAC";
import Button from "@/components/ui/button/Button";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/icons";
import { processExcelFile } from "@/utils/clientShipmentService";
import { useMessage } from "@/components/ui/MessageBox";

interface UploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

function ShipmentUploadPage() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { showSuccess, showError } = useMessage();

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

        // Store validation result in session storage with file information
        const validationData = {
          ...result,
          fileName: file.name,
          uploadDate: new Date().toISOString(),
          fileSize: file.size,
          fileId: result.fileId
        };
        console.log('Upload: Storing validation data:', validationData);
        sessionStorage.setItem('validationResult', JSON.stringify(validationData));
        sessionStorage.setItem('validShipments', JSON.stringify(result.validData));

        // Enhanced validation feedback
        const hasErrors = result.errors && result.errors.length > 0;
        const hasWarnings = result.warnings && result.warnings.length > 0;
        const validRecords = result.validData ? result.validData.length : 0;
        const totalErrors = result.errors ? result.errors.length : 0;

        if (hasErrors) {
          // Validation failed
          showError(
            "Validation Failed",
            `${file.name}: ${totalErrors} error(s) found. Please fix the errors and try again.`
          );
          
          // Update progress to error state
          setUploadProgress((prev) =>
            prev.map((item, index) =>
              index === i
                ? { ...item, status: "error", error: `${totalErrors} validation errors found` }
                : item
            )
          );
        } else {
          // Validation successful
          const message = hasWarnings
            ? `${file.name}: ${validRecords} valid records processed with ${result.warnings?.length || 0} warning(s).`
            : `${file.name}: ${validRecords} valid records processed successfully.`;
          
          showSuccess("Validation Successful", message);
          
          // Update progress to completed state
          setUploadProgress((prev) =>
            prev.map((item, index) =>
              index === i
                ? { ...item, progress: 100, status: "completed" }
                : item
            )
          );

          // Navigate to validation summary after successful validation
          setTimeout(() => {
            router.push('/user/validation-summary');
          }, 1500);
        }
      } catch (error) {
        console.error('Error processing file:', error);
        
        // Update progress to error state
        setUploadProgress((prev) =>
          prev.map((item, index) =>
            index === i
              ? { ...item, status: "error", error: error instanceof Error ? error.message : 'Unknown error occurred' }
              : item
          )
        );

        showError(
          "Upload Failed",
          `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
        );
      }
    }

    setIsUploading(false);
  }, [router, showSuccess, showError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: true,
    disabled: isUploading
  });

  const clearProgress = () => {
    setUploadProgress([]);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Shipment Upload
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload Excel or CSV files containing shipment data for validation and processing
        </p>
      </div>

      {/* Upload Zone */}
      <div className="mb-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <input {...getInputProps()} />
          <PlusIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Supports Excel (.xlsx, .xls) and CSV files
          </p>
          {!isUploading && (
            <Button className="mt-4" variant="outline">
              Select Files
            </Button>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Upload Progress
            </h3>
            <Button onClick={clearProgress} variant="outline" size="sm">
              Clear
            </Button>
          </div>
          
          <div className="space-y-3">
            {uploadProgress.map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.fileName}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : item.status === 'error'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {item.status === 'completed' ? 'Completed' : item.status === 'error' ? 'Error' : 'Uploading'}
                  </span>
                </div>
                
                {item.status === 'uploading' && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                
                {item.status === 'completed' && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    File processed successfully
                  </p>
                )}
                
                {item.status === 'error' && item.error && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {item.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">
          Upload Instructions
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <li>• Ensure your file contains the required shipment data columns</li>
          <li>• Supported formats: Excel (.xlsx, .xls) and CSV files</li>
          <li>• Maximum file size: 10MB per file</li>
          <li>• Files will be validated before processing</li>
          <li>• After successful validation, you'll be redirected to the validation summary</li>
        </ul>
      </div>
    </div>
  );
}

export default withSimpleRBAC(ShipmentUploadPage, {
  module: "shipment-operations",
  route: "/user/shipment-upload",
}); 