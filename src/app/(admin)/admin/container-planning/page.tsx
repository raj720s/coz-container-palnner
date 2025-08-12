"use client";

import { withAdminAuth } from "@/components/auth/withAuth";
import Button from "@/components/ui/button/Button";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { planContainers, savePlanningResults } from "@/utils/containerPlanningService";
import { downloadResultsExcel } from "@/utils/exportResultsService";
import { localStorageService } from "@/utils/localStorageService";

interface PlanningStage {
  id: string;
  name: string;
  status: "pending" | "in-progress" | "completed" | "error";
  progress: number;
  description: string;
}

function ContainerPlanningPage() {
  const router = useRouter();
  const [isPlanning, setIsPlanning] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [validationPassed, setValidationPassed] = useState(false);
  const [planningResult, setPlanningResult] = useState<any>(null);
  const [showExportButton, setShowExportButton] = useState(false);

  // Check validation status on component mount
  useEffect(() => {
    const checkValidation = () => {
      try {
        const storedData = sessionStorage.getItem('validationResult');
        if (!storedData) {
          toast.error('No validation data found. Please upload and validate a file first.');
          router.push('/admin/shipment-upload');
          return;
        }

        const validationData = JSON.parse(storedData);
        
        // Check if there are any validation errors
        if (validationData.errors && validationData.errors.length > 0) {
          toast.error('Validation has errors. Please fix them before proceeding to container planning.');
          router.push('/admin/validation-summary');
          return;
        }

        // Check if there are valid shipments
        if (!validationData.validData || validationData.validData.length === 0) {
          toast.error('No valid shipments found. Please upload a file with valid data.');
          router.push('/admin/shipment-upload');
          return;
        }

        setValidationPassed(true);
      } catch (error) {
        console.error('Error checking validation:', error);
        toast.error('Error checking validation status.');
        router.push('/admin/shipment-upload');
      }
    };

    checkValidation();
  }, [router]);
  const [stages, setStages] = useState<PlanningStage[]>([
    {
      id: "1",
      name: "Shipment Grouping",
      status: "pending",
      progress: 0,
      description: "Analyzing and grouping shipments by destination, POL, and compatibility",
    },
    {
      id: "2",
      name: "Load Optimization",
      status: "pending",
      progress: 0,
      description: "Optimizing container load distribution and capacity utilization",
    },
    {
      id: "3",
      name: "Container Assignment",
      status: "pending",
      progress: 0,
      description: "Assigning optimized container types and finalizing load plans",
    },
  ]);

  const startPlanning = async () => {
    setIsPlanning(true);
    setCurrentStage(0);

    try {
      // Get validation data from session storage
      const storedData = sessionStorage.getItem('validationResult');
      if (!storedData) {
        throw new Error('No validation data available');
      }

      const validationData = JSON.parse(storedData);
      
      // Get valid shipments data
      if (!validationData.validData || validationData.validData.length === 0) {
        throw new Error('No valid shipment data found.');
      }

      // Transform data to ShipmentData format for planning
      const shipmentData = validationData.validData.map((data: any, index: number) => ({
        id: `shipment_${index + 1}`,
        shipmentId: data.SHIPMENT || '',
        customer: data.CUSTOMER || data.CUSTOME || '',
        supplier: data.SUPPLIER || '',
        volume: parseFloat((data.VOLUME || '0').toString().replace(',', '')) || 0,
        qty: parseInt((data.Qty || '0').toString().replace(',', '')) || 0,
        rcvPug: data['RCV/PUG'] || '',
        pol: data.POL || '',
        destsite: data.Destsite || '',
        fileId: validationData.fileId || 'client_planning',
        uploadDate: new Date().toISOString()
      }));

      // Stage 1: Shipment Grouping
      setCurrentStage(0);
      setStages(prev => prev.map((stage, index) => 
        index === 0 
          ? { ...stage, status: "in-progress", progress: 0 }
          : stage
      ));

      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setStages(prev => prev.map((stage, index) => 
          index === 0 
            ? { ...stage, progress }
            : stage
        ));
      }

      setStages(prev => prev.map((stage, index) => 
        index === 0 
          ? { ...stage, status: "completed", progress: 100 }
          : stage
      ));

      // Stage 2: Load Optimization
      setCurrentStage(1);
      setStages(prev => prev.map((stage, index) => 
        index === 1 
          ? { ...stage, status: "in-progress", progress: 0 }
          : stage
      ));

      // Run container planning algorithm (client-side)
      const planningResult = await planContainers(shipmentData);
      
      // Save planning results
      const savedResult = savePlanningResults(planningResult, validationData.fileId || 'client_planning');

      // Store planning result for export
      setPlanningResult(savedResult);
      setShowExportButton(true);

      // Mark all stages as completed
      setStages(prev => prev.map(stage => 
        ({ ...stage, status: "completed", progress: 100 })
      ));

      setIsPlanning(false);
      toast.success("Container planning completed successfully!");
      
      // Don't redirect immediately, let user export results first
      // router.push("/admin/assignment-results");

    } catch (error) {
      console.error('Planning error:', error);
      setIsPlanning(false);
      
      // Mark current stage as error
      setStages(prev => prev.map((stage, index) => 
        index === currentStage 
          ? { ...stage, status: "error", progress: 0 }
          : stage
      ));

      toast.error(error instanceof Error ? error.message : 'Planning failed');
    }
  };

  const getStatusColor = (status: PlanningStage["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-600 dark:text-green-400";
      case "in-progress":
        return "text-blue-600 dark:text-blue-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-500 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: PlanningStage["status"]) => {
    switch (status) {
      case "completed":
        return (
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "in-progress":
        return (
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case "error":
        return (
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Show loading state while checking validation
  if (!validationPassed) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking validation status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Container Planning
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Run container planning algorithm to optimize assignments
          </p>
        </div>
        <div className="flex gap-3">
          {showExportButton && planningResult && (
            <Button
              onClick={() => {
                try {
                  downloadResultsExcel(planningResult, 'Book-results.xlsx');
                  toast.success('Results exported successfully!');
                } catch (error) {
                  console.error('Export error:', error);
                  toast.error('Failed to export results');
                }
              }}
              size="md"
              className="bg-green-600 hover:bg-green-700"
            >
              📊 Export Results (Book Format)
            </Button>
          )}
          <Button
            onClick={startPlanning}
            disabled={isPlanning}
            size="md"
            className={isPlanning ? "opacity-50 cursor-not-allowed" : ""}
          >
            {isPlanning ? "Planning in Progress..." : "Run Container Planning"}
          </Button>
        </div>
      </div>

      {/* Planning Stages */}
      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div
            key={stage.id}
            className={`p-6 bg-white rounded-lg shadow dark:bg-gray-800 border-l-4 ${
              stage.status === "completed"
                ? "border-l-green-500"
                : stage.status === "in-progress"
                ? "border-l-blue-500"
                : stage.status === "error"
                ? "border-l-red-500"
                : "border-l-gray-300 dark:border-l-gray-600"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(stage.status)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stage.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stage.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${getStatusColor(stage.status)}`}>
                  {stage.status === "completed"
                    ? "Completed"
                    : stage.status === "in-progress"
                    ? "In Progress"
                    : stage.status === "error"
                    ? "Error"
                    : "Pending"}
                </span>
                {stage.status === "in-progress" && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stage.progress}%
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  stage.status === "completed"
                    ? "bg-green-500"
                    : stage.status === "in-progress"
                    ? "bg-blue-500"
                    : stage.status === "error"
                    ? "bg-red-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
                style={{ width: `${stage.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Planning Results Summary */}
      {showExportButton && planningResult && (
        <div className="p-6 bg-green-50 rounded-lg dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-green-900 dark:text-green-100">
              🎉 Planning Completed Successfully!
            </h3>
            <Button
              onClick={() => router.push("/admin/assignment-results")}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              View Detailed Results
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {planningResult.summary.totalShipments}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">Total Shipments</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {planningResult.summary.assignedShipments}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">Assigned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {planningResult.summary.totalContainers}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">Containers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {planningResult.summary.unassignedShipments}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">Unassigned</p>
            </div>
          </div>
          
          <div className="text-sm text-green-800 dark:text-green-200">
            <p><strong>Next Steps:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Click "Export Results (Book Format)" to download the Excel file</li>
              <li>The file will match the exact format of Book-results.xlsx</li>
              <li>Click "View Detailed Results" to see the full planning breakdown</li>
            </ul>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Shipments</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">1,234</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full dark:bg-green-900">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Containers Assigned</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">567</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full dark:bg-yellow-900">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Optimization Score</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">94%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-6 bg-blue-50 rounded-lg dark:bg-blue-900/20">
        <h3 className="mb-3 text-lg font-medium text-blue-900 dark:text-blue-100">
          Planning Process
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>• <strong>Data Bucketing:</strong> Groups shipments by container type and capacity requirements</li>
          <li>• <strong>Container Planning:</strong> Optimizes container assignments based on capacity and priority</li>
          <li>• <strong>Mode Selection:</strong> Determines FCL/LCL mode for each shipment</li>
          <li>• <strong>Repositioning Analysis:</strong> Analyzes container repositioning requirements</li>
        </ul>
      </div>
    </div>
  );
}

export default withAdminAuth(ContainerPlanningPage); 