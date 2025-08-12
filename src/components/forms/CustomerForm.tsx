"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import Button from "@/components/ui/button/Button";

const customerSchema = z.object({
  code: z.string().min(1, "Customer code is required"),
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  isActive: z.boolean(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  initialData?: CustomerFormData & { id?: string };
  onSubmit: (data: CustomerFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
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
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      code: "",
      name: "",
      email: "",
      phone: "",
      address: "",
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
        code: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        isActive: true,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: CustomerFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Customer Code *</Label>
          <Input
            placeholder="e.g., CUST001, CUST002"
            {...register("code")}
            error={errors.code?.message}
          />
        </div>
        <div>
          <Label>Customer Name *</Label>
          <Input
            placeholder="e.g., ABC Company Ltd"
            {...register("name")}
            error={errors.name?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Email Address *</Label>
          <Input
            type="email"
            placeholder="e.g., contact@abc.com"
            {...register("email")}
            error={errors.email?.message}
          />
        </div>
        <div>
          <Label>Phone Number *</Label>
          <Input
            placeholder="e.g., +65 1234 5678"
            {...register("phone")}
            error={errors.phone?.message}
          />
        </div>
      </div>

      <div>
        <Label>Address *</Label>
        <Input
          placeholder="e.g., 123 Business Street, Singapore 123456"
          {...register("address")}
          error={errors.address?.message}
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
            isEditing ? "Update Customer" : "Create Customer"
          )}
        </Button>
      </div>
    </form>
  );
}; 