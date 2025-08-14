"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import Button from "@/components/ui/button/Button";

const containerTypeSchema = z.object({
  name: z.string().min(1, "Container name is required"),
  code: z.string().min(1, "Container code is required"),
  description: z.string().optional(),
  capacity: z.number().min(1, "Capacity must be greater than 0"),
  isActive: z.boolean(),
});

export type ContainerTypeFormData = z.infer<typeof containerTypeSchema>;

interface ContainerTypeFormProps {
  initialData?: ContainerTypeFormData & { id?: string };
  onSubmit: (data: ContainerTypeFormData) => void;
  onCancel?: () => void;
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
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ContainerTypeFormData>({
    resolver: zodResolver(containerTypeSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      capacity: 0,
      isActive: true,
    },
  });

  const isActive = watch("isActive");
  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        name: "",
        code: "",
        description: "",
        capacity: 0,
        isActive: true,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: ContainerTypeFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Container Name *</Label>
          <Input
            placeholder="e.g., 40 High Cube"
            {...register("name")}
            error={errors.name?.message}
          />
        </div>
        <div>
          <Label>Container Code *</Label>
          <Input
            placeholder="e.g., 40HC"
            {...register("code")}
            error={errors.code?.message}
          />
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Input
          placeholder="Optional description"
          {...register("description")}
          error={errors.description?.message}
        />
      </div>

      <div>
        <Label>Capacity (CBM) *</Label>
        <Input
          type="number"
          placeholder="e.g., 67.7"
          {...register("capacity", { valueAsNumber: true })}
          error={errors.capacity?.message}
        />
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          {...register("isActive")}
          checked={isActive}
          onChange={(e) => setValue("isActive", e.target.checked)}
        />
        <Label className="text-sm">Active</Label>
      </div>

      {errors.isActive && (
        <p className="text-xs text-red-500">{errors.isActive.message}</p>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit(handleFormSubmit)}
          disabled={isLoading}
          className="min-w-[100px]"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </div>
          ) : (
            isEditing ? "Update Container Type" : "Create Container Type"
          )}
        </Button>
      </div>
    </form>
  );
}; 