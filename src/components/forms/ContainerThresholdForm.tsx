"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";

interface ContainerThresholdFormData {
  containerType: string;
  minCBM: number;
  maxCBM: number;
  pol: string;
  isDefault: boolean;
  isActive: boolean;
  description: string;
}

interface ContainerThresholdFormProps {
  initialData?: ContainerThresholdFormData;
  onSubmit: (data: ContainerThresholdFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ContainerThresholdForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: ContainerThresholdFormProps) {
  const [formData, setFormData] = useState<ContainerThresholdFormData>({
    containerType: "",
    minCBM: 0,
    maxCBM: 0,
    pol: "",
    isDefault: false,
    isActive: true,
    description: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const containerTypes = [
    "20GP", "40GP", "40HC", "40FT", "40HQ", "LCL"
  ];

  const polOptions = [
    "", "Shanghai", "Yantian", "Qingdao", "Ningbo", "Tianjin", "Dalian"
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Container Type *
          </label>
          <select
            value={formData.containerType}
            onChange={(e) => setFormData({ ...formData, containerType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            required
          >
            <option value="">Select Container Type</option>
            {containerTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            POL (Port of Loading)
          </label>
          <select
            value={formData.pol}
            onChange={(e) => setFormData({ ...formData, pol: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            <option value="">Default (All POLs)</option>
            {polOptions.filter(pol => pol !== "").map(pol => (
              <option key={pol} value={pol}>{pol}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Min CBM *
          </label>
          <Input
            type="number"
            step="0.1"
            min="0"
            value={formData.minCBM}
            onChange={(e) => setFormData({ ...formData, minCBM: parseFloat(e.target.value) || 0 })}
            placeholder="0.0"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Max CBM *
          </label>
          <Input
            type="number"
            step="0.1"
            min="0"
            value={formData.maxCBM}
            onChange={(e) => setFormData({ ...formData, maxCBM: parseFloat(e.target.value) || 0 })}
            placeholder="0.0"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          rows={3}
          placeholder="Enter description for this threshold..."
        />
      </div>

      <div className="flex gap-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isDefault"
            checked={formData.isDefault}
            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
            Default Threshold
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
            Active
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : (initialData ? "Update Threshold" : "Create Threshold")}
        </Button>
      </div>
    </form>
  );
}
