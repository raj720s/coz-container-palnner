"use client";

import { withUserAuth } from "@/components/auth/withAuth";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { BoltIcon, CheckCircleIcon, TimeIcon, AlertIcon, DownloadIcon } from "@/icons";
import { planContainers, savePlanningResults } from "@/utils/containerPlanningService";
import { downloadResultsExcel } from "@/utils/exportResultsService";

interface PlanningStage {
  name: string;
  status: "pending" | "running" | "completed" | "error";
  progress: number;
  description: string;
}

interface PlanningResult {
  totalShipments: number;
  assignedShipments: number;
  unassignedShipments: number;
  totalContainers: number;
  averageUtilization: number;
  totalCost: number;
  planningTime: number;
}

function UserContainerPlanningPage() {
  const [isPlanning, setIsPlanning] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [planningResult, setPlanningResult] = useState<any>(null);
  const [showExportButton, setShowExportButton] = useState(false);
  const [stages, setStages] = useState<PlanningStage[]>([
    {
      name: "Data Validation",
      status: "pending",
      progress: 0,
      description: "Validating shipment data and requirements"
    },
    {
      name: "Container Matching",
      status: "pending",
      progress: 0,
      description: "Matching shipments with optimal containers"
    },
    {
      name: "Route Optimization",
      status: "pending",
      progress: 0,
      description: "Optimizing shipping routes and schedules"
    },
    {
      name: "Cost Analysis",
      status: "pending",
      progress: 0,
      description: "Analyzing costs and generating recommendations"
    }
  ]);
  const router = useRouter();

  // Check for validation result from session storage
  useEffect(() => {
    const validationResult = sessionStorage.getItem('validationResult');
    if (!validationResult) {
      toast.error("No shipment data found. Please upload shipments first.");
      router.push('/user/shipment-upload');
      return;
    }

    try {
      const parsed = JSON.parse(validationResult);
      if (parsed.invalidRecords > 0) {
        toast.error("Please fix validation errors before proceeding with planning.");
        router.push('/user/shipment-upload');
      }
    } catch (error) {
      console.error('Error parsing validation result:', error);
      toast.error("Invalid validation data. Please upload shipments again.");
      router.push('/user/shipment-upload');
    }
  }, [router]);

  const handleStartPlanning = async () => {
    setIsPlanning(true);
    setCurrentStage(0);
    setPlanningResult(null);
    toast.success("Container planning started");
    
    try {
      // Get validation result from session storage
      const validationResult = sessionStorage.getItem('validationResult');
      if (!validationResult) {
        throw new Error("No validation data found");
      }

      const parsed = JSON.parse(validationResult);
      
      // Start planning process
      await simulatePlanningProcess(parsed);
    } catch (error) {
      console.error('Planning error:', error);
      toast.error("Planning failed. Please try again.");
      setIsPlanning(false);
    }
  };

  const simulatePlanningProcess = async (validationData: any) => {
    let stageIndex = 0;
    
    const processStage = () => {
      if (stageIndex >= stages.length) {
        // Call the container planning API
        callPlanningAPI(validationData);
        return;
      }

      setCurrentStage(stageIndex);
      
      // Update current stage to running
      setStages(prev => prev.map((stage, index) => 
        index === stageIndex 
          ? { ...stage, status: "running" as const }
          : stage
      ));

      // Simulate stage progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        
        setStages(prev => prev.map((stage, index) => 
          index === stageIndex 
            ? { ...stage, progress }
            : stage
        ));

        if (progress >= 100) {
          clearInterval(progressInterval);
          
          // Mark stage as completed
          setStages(prev => prev.map((stage, index) => 
            index === stageIndex 
              ? { ...stage, status: "completed" as const, progress: 100 }
              : stage
          ));

          // Move to next stage after a delay
          setTimeout(() => {
            stageIndex++;
            processStage();
          }, 500);
        }
      }, 200);
    };

    processStage();
  };

  const callPlanningAPI = async (validationData: any) => {
    try {
      // Update final stage to running
      setStages(prev => prev.map((stage, index) => 
        index === stages.length - 1 
          ? { ...stage, status: "running" as const }
          : stage
      ));

      // Prepare shipment data for planning
      const shipmentData = (validationData.validData || validationData.validShipments || []).map((data: any, index: number) => ({
        id: `shipment_${index + 1}`,
        shipmentId: data.SHIPMENT || '',
        customer: data.CUSTOMER || data.CUSTOME || '',
        supplier: data.SUPPLIER || '',
        volume: parseFloat((data.VOLUME || '0').toString().replace(',', '')) || 0,
        qty: parseInt((data.Qty || '0').toString().replace(',', '')) || 0,
        rcvPug: data['RCV/PUG'] || '',
        pol: data.POL || '',
        destsite: data.Destsite || '',
        fileId: validationData.fileId || 'user_planning',
        uploadDate: new Date().toISOString()
      }));

      // Run container planning algorithm (client-side)
      const planningResult = await planContainers(shipmentData);
      
      // Save planning results
      const savedResult = savePlanningResults(planningResult, validationData.fileId || 'client_planning');
      
      // Store planning result for export
      setPlanningResult(savedResult);
      setShowExportButton(true);

      // Store planning results in session storage for the results page
      sessionStorage.setItem('planningResults', JSON.stringify({
        totalShipments: planningResult.totalShipments,
        assignedShipments: planningResult.assignedShipments,
        unassignedShipments: planningResult.unassignedShipmentsCount,
        totalContainers: planningResult.totalContainers,
        containerTypes: planningResult.containerTypes,
        assignments: planningResult.assignments,
        summary: planningResult.summary
      }));

      // Mark final stage as completed
      setStages(prev => prev.map((stage, index) => 
        index === stages.length - 1 
          ? { ...stage, status: "completed" as const, progress: 100 }
          : stage
      ));

      // Store planning result
      setPlanningResult({
        totalShipments: planningResult.totalShipments,
        assignedShipments: planningResult.assignedShipments,
        unassignedShipments: planningResult.unassignedShipmentsCount,
        totalContainers: planningResult.totalContainers,
        averageUtilization: planningResult.totalContainers > 0 ? (planningResult.assignedShipments / planningResult.totalContainers * 100) : 0,
        totalCost: planningResult.totalContainers * 100, // Mock cost calculation
        planningTime: Date.now()
      });

      // Store result in session storage for results page
      sessionStorage.setItem('planningResult', JSON.stringify(planningResult));

      setIsPlanning(false);
      toast.success("Container planning completed successfully!");
      
    } catch (error) {
      console.error('API call error:', error);
      
      // Mark final stage as error
      setStages(prev => prev.map((stage, index) => 
        index === stages.length - 1 
          ? { ...stage, status: "error" as const, progress: 100 }
          : stage
      ));

      setIsPlanning(false);
      toast.error("Planning failed. Please try again.");
    }
  };

  const handleViewResults = () => {
    router.push('/user/assignment-results');
  };

  const handleDownloadResults = () => {
    if (!planningResult) {
      toast.error("No planning results available");
      return;
    }

    // In a real app, this would generate and download the planning results
    toast.success("Downloading planning results...");
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case "running":
        return <BoltIcon className="w-6 h-6 text-blue-600 animate-pulse" />;
      case "error":
        return <AlertIcon className="w-6 h-6 text-red-600" />;
      default:
        return <TimeIcon className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "running":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      default:
        return "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Container Planning
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Run container planning algorithm to optimize assignments
        </p>
        <div className="flex gap-2 mt-4">
          {showExportButton && planningResult && (
            <button
              onClick={() => {
                try {
                  downloadResultsExcel(planningResult, 'Book-results.xlsx');
                  toast.success('Results exported successfully!');
                } catch (error) {
                  console.error('Export error:', error);
                  toast.error('Failed to export results');
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              📊 Export Results (Book Format)
            </button>
          )}
          <button
            onClick={handleStartPlanning}
            disabled={isPlanning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlanning ? "Planning in Progress..." : "Run Container Planning"}
          </button>
        </div>
      </div>

      {/* Planning Progress */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Planning Progress
          </h2>
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStageColor(stage.status)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStageIcon(stage.status)}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {stage.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {stage.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      stage.status === "completed" ? "bg-green-500" :
                      stage.status === "running" ? "bg-blue-500" :
                      stage.status === "error" ? "bg-red-500" :
                      "bg-gray-300"
                    }`}
                    style={{ width: `${stage.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Planning Results Summary */}
      {showExportButton && planningResult && (
        <div className="p-6 bg-green-50 rounded-lg dark:bg-green-900/20 border border-green-200 dark:border-green-800 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-green-900 dark:text-green-100">
              🎉 Planning Completed Successfully!
            </h3>
            <button
              onClick={() => router.push("/user/assignment-results")}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              View Detailed Results
            </button>
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

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        {!isPlanning && !planningResult && (
          <Button onClick={handleStartPlanning}>
            <BoltIcon className="w-5 h-5 mr-2" />
            Start Planning
          </Button>
        )}
        
        {planningResult && (
          <>
            <Button onClick={handleViewResults}>
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              View Results
            </Button>
            <Button onClick={handleDownloadResults} variant="outline">
              <DownloadIcon className="w-5 h-5 mr-2" />
              Download Results
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default withUserAuth(UserContainerPlanningPage); 