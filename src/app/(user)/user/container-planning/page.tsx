"use client";

import { withSimpleRBAC } from "@/components/auth/withSimpleRBAC";
import Button from "@/components/ui/button/Button";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { planContainers, savePlanningResults } from "@/utils/containerPlanningService";
import { downloadResultsExcel } from "@/utils/exportResultsService";
import { ContainerPlanningResult } from "@/utils/localStorageService";

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
  const [planningResult, setPlanningResult] = useState<Record<string, unknown> | null>(null);
  const [showExportButton, setShowExportButton] = useState(false);

  // Check validation status on component mount
  useEffect(() => {
    const checkValidation = () => {
      try {
        const storedData = sessionStorage.getItem('validationResult');
        if (!storedData) {
          toast.error('No validation data found. Please upload and validate a file first.');
          router.push('/user/shipment-upload');
          return;
        }

        const validationData = JSON.parse(storedData);
        
        // Check if there are any validation errors
        if (validationData.errors && validationData.errors.length > 0) {
          toast.error('Validation has errors. Please fix them before proceeding to container planning.');
          router.push('/user/validation-summary');
          return;
        }

        // Check if there are valid shipments
        if (!validationData.validData || validationData.validData.length === 0) {
          toast.error('No valid shipments found. Please upload a file with valid data.');
          router.push('/user/shipment-upload');
          return;
        }

        setValidationPassed(true);
      } catch (error) {
        console.error('Error checking validation:', error);
        toast.error('Error checking validation status.');
        router.push('/user/shipment-upload');
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
      const validShipments = validationData.validData;

      // Stage 1: Shipment Grouping
      setCurrentStage(0);
      updateStageStatus(0, "in-progress", 0);
      
      await simulateProgress(0, 100, 50);
      updateStageStatus(0, "completed", 100);
      
      // Stage 2: Load Optimization
      setCurrentStage(1);
      updateStageStatus(1, "in-progress", 0);
      
      await simulateProgress(1, 100, 80);
      updateStageStatus(1, "completed", 100);
      
      // Stage 3: Container Assignment
      setCurrentStage(2);
      updateStageStatus(2, "in-progress", 0);
      
      await simulateProgress(2, 100, 100);
      updateStageStatus(2, "completed", 100);

      // Execute container planning
      const result = await planContainers(validShipments);
      
      // Save results
      await savePlanningResults(result);
      
      setPlanningResult(result);
      setShowExportButton(true);
      
      toast.success('Container planning completed successfully!');
      
    } catch (error) {
      console.error('Planning error:', error);
      toast.error('Container planning failed. Please try again.');
      
      // Mark current stage as error
      if (currentStage < stages.length) {
        updateStageStatus(currentStage, "error", 0);
      }
    } finally {
      setIsPlanning(false);
    }
  };

  const updateStageStatus = (stageIndex: number, status: PlanningStage["status"], progress: number) => {
    setStages(prev => prev.map((stage, index) => 
      index === stageIndex 
        ? { ...stage, status, progress }
        : stage
    ));
  };

  const simulateProgress = async (stageIndex: number, targetProgress: number, duration: number) => {
    const steps = 20;
    const increment = targetProgress / steps;
    const delay = duration / steps;

    for (let i = 0; i <= steps; i++) {
      const progress = Math.min(i * increment, targetProgress);
      updateStageStatus(stageIndex, "in-progress", progress);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  };

  const handleExport = async () => {
    try {
      await downloadResultsExcel();
      toast.success('Results exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    }
  };

  const handleViewResults = () => {
    router.push('/user/assignment-results');
  };

  const resetPlanning = () => {
    setStages(prev => prev.map(stage => ({
      ...stage,
      status: "pending" as const,
      progress: 0
    })));
    setCurrentStage(0);
    setPlanningResult(null);
    setShowExportButton(false);
  };

  if (!validationPassed) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking validation status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Container Planning
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Optimize container load distribution and generate efficient shipping plans
        </p>
      </div>

      {/* Planning Stages */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Planning Process</h2>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className={`p-4 rounded-lg border ${
                stage.status === "completed"
                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                  : stage.status === "in-progress"
                  ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                  : stage.status === "error"
                  ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                  : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stage.status === "completed"
                      ? "bg-green-500 text-white"
                      : stage.status === "in-progress"
                      ? "bg-blue-500 text-white"
                      : stage.status === "error"
                      ? "bg-red-500 text-white"
                      : "bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                  }`}>
                    {stage.status === "completed" ? "✓" : stage.status === "in-progress" ? "⟳" : stage.status === "error" ? "✗" : index + 1}
                  </div>
                  <div>
                    <h3 className={`font-medium ${
                      stage.status === "completed"
                        ? "text-green-800 dark:text-green-200"
                        : stage.status === "in-progress"
                        ? "text-blue-800 dark:text-blue-200"
                        : stage.status === "error"
                        ? "text-red-800 dark:text-red-200"
                        : "text-gray-700 dark:text-gray-300"
                    }`}>
                      {stage.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stage.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stage.progress}%
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    stage.status === "completed"
                      ? "bg-green-500"
                      : stage.status === "in-progress"
                      ? "bg-blue-500"
                      : stage.status === "error"
                      ? "bg-red-500"
                      : "bg-gray-300"
                  }`}
                  style={{ width: `${stage.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        {!isPlanning && !showExportButton && (
          <Button
            onClick={startPlanning}
            className="flex items-center gap-2"
            disabled={!validationPassed}
          >
            Start Container Planning
          </Button>
        )}
        
        {showExportButton && (
          <>
            <Button
              onClick={handleExport}
              variant="outline"
              className="flex items-center gap-2"
            >
              Export Results
            </Button>
            <Button
              onClick={handleViewResults}
              className="flex items-center gap-2"
            >
              View Results
            </Button>
            <Button
              onClick={resetPlanning}
              variant="outline"
              className="flex items-center gap-2"
            >
              Reset Planning
            </Button>
          </>
        )}
      </div>

      {/* Planning Status */}
      {isPlanning && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div>
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
                Planning in Progress...
              </h3>
              <p className="text-blue-800 dark:text-blue-200">
                Currently processing: {stages[currentStage]?.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      {planningResult && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">✓</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-green-900 dark:text-green-100">
                Planning Completed Successfully!
              </h3>
              <p className="text-green-800 dark:text-green-200">
                Container planning has been completed. You can now export the results or view them in detail.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          How Container Planning Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">1. Shipment Grouping</h4>
            <p>Shipments are analyzed and grouped by destination, port of loading, and compatibility factors.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">2. Load Optimization</h4>
            <p>Advanced algorithms optimize container load distribution for maximum capacity utilization.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">3. Container Assignment</h4>
            <p>Optimal container types are assigned and final load plans are generated.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withSimpleRBAC(ContainerPlanningPage, {
  route: "/user/container-planning"
}); 