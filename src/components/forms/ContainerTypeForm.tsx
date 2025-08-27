"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

// Form validation schema
const containerTypeSchema = z.object({
  code: z.string().min(1, "Code is required").max(10, "Code must be less than 10 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  capacity: z.string().min(1, "Capacity is required").max(100, "Capacity must be less than 100 characters"),
  status: z.boolean(),
});

export type ContainerTypeFormData = z.infer<typeof containerTypeSchema>;

interface ContainerTypeFormProps {
  initialData?: Partial<ContainerTypeFormData>;
  onSubmit: (data: ContainerTypeFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ContainerTypeForm: React.FC<ContainerTypeFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    setValue,
  } = useForm<ContainerTypeFormData>({
    resolver: zodResolver(containerTypeSchema),
          defaultValues: {
        code: initialData?.code || "",
        name: initialData?.name || "",
        description: initialData?.description || "",
        capacity: initialData?.capacity || "",
        status: initialData?.status ?? true,
      },
  });

  const handleFormSubmit = async (data: ContainerTypeFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Code Field */}
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Container Code *
        </label>
        <Input
          id="code"
          {...register("code")}
          placeholder="Enter container code (e.g., 20GP, 40HC)"
          error={errors.code?.message}
          disabled={isLoading}
        />
      </div>

      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Container Name *
        </label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Enter container name (e.g., 20ft General Purpose, 40ft High Cube)"
          error={errors.name?.message}
          disabled={isLoading}
        />
      </div>

      {/* Description Field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description *
        </label>
        <textarea
          id="description"
          {...register("description")}
          placeholder="Enter container description (e.g., Standard 20ft general purpose container)"
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
            errors.description ? "border-red-500" : "border-gray-300"
          }`}
          rows={3}
          disabled={isLoading}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
        )}
      </div>

      {/* Capacity Field */}
      <div>
        <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Capacity *
        </label>
        <Input
          id="capacity"
          {...register("capacity")}
          placeholder="Enter container capacity (e.g., 67.7 CBM, 28,000 kg)"
          error={errors.capacity?.message}
          disabled={isLoading}
        />
      </div>

      {/* Status Field */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        <Select
          options={[
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" }
          ]}
          value={watch("status") ? "true" : "false"}
          onChange={(value) => setValue("status", value === "true")}
          disabled={isLoading}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          disabled={!isValid || isLoading}
          className="min-w-[100px]"
        >
          {isLoading ? "Saving..." : initialData ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}; 