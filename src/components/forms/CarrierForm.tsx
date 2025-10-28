"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

// Form validation schema
const carrierSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  carrier_code: z.string().min(1, "Carrier code is required").max(50, "Carrier code must be less than 50 characters"),
  transportation_mode: z.number().int().default(5),
  is_active: z.boolean(),
});

export type CarrierFormData = z.infer<typeof carrierSchema>;

interface CarrierFormProps {
  initialData?: Partial<CarrierFormData>;
  onSubmit: (data: CarrierFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CarrierForm: React.FC<CarrierFormProps> = ({
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
  } = useForm<CarrierFormData>({
    resolver: zodResolver(carrierSchema),
    defaultValues: {
      name: initialData?.name || "",
      carrier_code: initialData?.carrier_code || "",
      transportation_mode: initialData?.transportation_mode ?? 5,
      is_active: initialData?.is_active ?? true,
    },
  });

  const handleFormSubmit = async (data: CarrierFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Carrier Name *
        </label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Enter carrier name (e.g., MAERSK LINE, COSCO SHIPPING)"
          error={errors.name?.message}
          disabled={isLoading}
        />
      </div>

      {/* Carrier Code Field */}
      <div>
        <label htmlFor="carrier_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Carrier Code *
        </label>
        <Input
          id="carrier_code"
          {...register("carrier_code")}
          placeholder="Enter carrier code (e.g., MAEU, COSU)"
          error={errors.carrier_code?.message}
          disabled={isLoading}
        />
      </div>

      {/* Transportation Mode Field */}
      <div>
        <label htmlFor="transportation_mode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Transportation Mode
        </label>
        <Input
          id="transportation_mode"
          type="number"
          {...register("transportation_mode", { valueAsNumber: true })}
          placeholder="Enter transportation mode (default: 5)"
          error={errors.transportation_mode?.message}
          disabled={isLoading}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Default value is 5. Adjust as needed based on your transportation mode configuration.
        </p>
      </div>

      {/* Status Field */}
      <div>
        <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        <Select
          options={[
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" }
          ]}
          value={watch("is_active") ? "true" : "false"}
          onChange={(value) => setValue("is_active", value === "true")}
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

