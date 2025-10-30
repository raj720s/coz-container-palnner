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
  onSubmit: (data: CarrierFormData) => void;
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
    resolver: zodResolver(carrierSchema) as any,
    defaultValues: {
      name: initialData?.name ?? "",
      carrier_code: initialData?.carrier_code ?? "",
      transportation_mode: initialData?.transportation_mode ?? 5,
      is_active: initialData?.is_active ?? true,
    } as CarrierFormData,
  });

  const handleFormSubmit = (data: CarrierFormData) => {
    onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={(...args) => (handleSubmit as any)(handleFormSubmit)(...args)} className="p-6 space-y-8">
      {/* Basic Details */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Basic Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
      </section>

      {/* Configuration */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transportation Mode
            </label>
            <Select
              options={[
                { value: '5', label: 'Ocean' },
                { value: '10', label: 'Air' },
                { value: '15', label: 'Road' },
                { value: '20', label: 'Rail' },
              ]}
              value={String(watch('transportation_mode'))}
              onChange={(value) => setValue('transportation_mode', Number(value))}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="true"
                  checked={watch('is_active') === true}
                  onChange={() => setValue('is_active', true)}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="false"
                  checked={watch('is_active') === false}
                  onChange={() => setValue('is_active', false)}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Inactive</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid || isLoading} className="min-w-[100px]">
          {isLoading ? "Saving..." : initialData ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
};

