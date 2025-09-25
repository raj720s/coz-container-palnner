"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import Button from "@/components/ui/button/Button";

const customerSchema = z.object({
  customer_code: z.string().min(1, "Customer code is required"),
  name: z.string().min(1, "Company name is required"),
  contact_person: z.string().min(1, "Contact person is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  country: z.string().min(1, "Country is required"),
  tax_id: z.string().min(1, "Tax ID is required"),
  is_active: z.boolean(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

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
      customer_code: "",
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      country: "",
      tax_id: "",
      is_active: true,
    },
  });

  const isActive = watch("is_active");
  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        customer_code: "",
        name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        country: "",
        tax_id: "",
        is_active: true,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: CustomerFormData) => {
    onSubmit(data);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      window.history.back();
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="customer_code" required>
            Customer Code
          </Label>
          <Input
            id="customer_code"
            {...register("customer_code")}
            placeholder="e.g., CUST001"
            error={errors.customer_code?.message}
          />
        </div>
        <div>
          <Label htmlFor="name" required>
            Company Name
          </Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="e.g., ABC Corporation"
            error={errors.name?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="contact_person" required>
            Contact Person
          </Label>
          <Input
            id="contact_person"
            {...register("contact_person")}
            placeholder="e.g., John Doe"
            error={errors.contact_person?.message}
          />
        </div>
        <div>
          <Label htmlFor="email" required>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="e.g., john@example.com"
            error={errors.email?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="phone" required>
            Phone
          </Label>
          <Input
            id="phone"
            {...register("phone")}
            placeholder="e.g., +1-555-123-4567"
            error={errors.phone?.message}
          />
        </div>
        <div>
          <Label htmlFor="country" required>
            Country
          </Label>
          <Input
            id="country"
            {...register("country")}
            placeholder="e.g., United States"
            error={errors.country?.message}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address" required>
          Address
        </Label>
        <Input
          id="address"
          {...register("address")}
          placeholder="e.g., 123 Business St, City, State, ZIP"
          error={errors.address?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="tax_id" required>
            Tax ID
          </Label>
          <Input
            id="tax_id"
            {...register("tax_id")}
            placeholder="e.g., 12-3456789"
            error={errors.tax_id?.message}
          />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Checkbox
            id="is_active"
            {...register("is_active")}
            checked={isActive}
            onChange={(e) => setValue("is_active", e.target.checked)}
          />
          <Label htmlFor="is_active" className="text-sm">
            Active
          </Label>
        </div>
      </div>


      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : (isEditing ? 'Update Customer' : 'Create Customer')}
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm; 