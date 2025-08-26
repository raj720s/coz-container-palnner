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
  code: z.string().min(1, "Container type code is required"),
  name: z.string().min(1, "Container type name is required"),
  description: z.string().min(1, "Description is required"),
  capacity: z.string().min(1, "Capacity is required"),
  status: z.boolean(),
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
      code: "",
      name: "",
      description: "",
      capacity: "",
      status: true,
    },
  });

  const isActive = watch("status");
  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        code: "",
        name: "",
        description: "",
        capacity: "",
        status: true,
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
          <Label htmlFor="name" required>
            Container Type Name
          </Label>
          <Input
            id="name"
            placeholder="e.g., 20ft General Purpose"
            {...register("name")}
            error={errors.name?.message}
          />
        </div>
        <div>
          <Label htmlFor="code" required>
            Container Type Code
          </Label>
          <Input
            id="code"
            placeholder="e.g., 20GP, 40HC"
            {...register("code")}
            error={errors.code?.message}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description" required>
          Description
        </Label>
        <Input
          id="description"
          placeholder="e.g., Standard 20ft general purpose container"
          {...register("description")}
          error={errors.description?.message}
        />
      </div>

      <div>
        <Label htmlFor="capacity" required>
          Capacity
        </Label>
        <Input
          id="capacity"
          placeholder="e.g., 67.7 CBM, 28,000 kg"
          {...register("capacity")}
          error={errors.capacity?.message}
        />
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          {...register("status")}
          checked={isActive}
          onChange={(e) => setValue("status", e.target.checked)}
        />
        <Label className="text-sm">Active</Label>
      </div>

      {errors.status && (
        <p className="text-xs text-red-500">{errors.status.message}</p>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <Button
            data-form-action="cancel"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          data-form-action="submit"
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