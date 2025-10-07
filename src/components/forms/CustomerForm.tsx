"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import Button from "@/components/ui/button/Button";

const dynamicFieldSchema = z.object({
  field_name: z.string(),
});

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
  dynamic_fields: z.array(dynamicFieldSchema).max(5).optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

interface DynamicField {
  field_name: string;
}

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
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);

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
      dynamic_fields: [],
    },
  });

  const isActive = watch("is_active");
  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      if (initialData.dynamic_fields) {
        setDynamicFields(initialData.dynamic_fields);
      }
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
        dynamic_fields: [],
      });
      setDynamicFields([]);
    }
  }, [initialData, reset]);

  const addDynamicField = () => {
    if (dynamicFields.length >= 5) {
      return; // Maximum 5 dynamic fields allowed
    }
    const newField: DynamicField = { field_name: "" };
    setDynamicFields([...dynamicFields, newField]);
  };

  const removeDynamicField = (index: number) => {
    const updatedFields = dynamicFields.filter((_, i) => i !== index);
    setDynamicFields(updatedFields);
    setValue("dynamic_fields", updatedFields);
  };

  const updateDynamicField = (index: number, fieldName: string) => {
    const updatedFields = dynamicFields.map((field, i) =>
      i === index ? { ...field, field_name: fieldName } : field
    );
    setDynamicFields(updatedFields);
    setValue("dynamic_fields", updatedFields);
  };

  const handleFormSubmit = (data: CustomerFormData) => {
    const formData = {
      ...data,
      dynamic_fields: dynamicFields.filter(field => field.field_name.trim() !== ""),
    };
    onSubmit(formData);
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

      {/* Dynamic Fields Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Dynamic Fields</h3>
            <p className="text-sm text-gray-500">
              {dynamicFields.length}/5 fields added
              {dynamicFields.length >= 5 && " (Maximum reached)"}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addDynamicField}
            disabled={isLoading || dynamicFields.length >= 5}
            className="text-sm"
          >
            + Add Field
          </Button>
        </div>
        
        {dynamicFields.length === 0 && (
          <p className="text-sm text-gray-500 italic">No dynamic fields added yet. Click "Add Field" to add custom fields (max 5).</p>
        )}
        
        {dynamicFields.map((field, index) => (
          <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex-1">
              <Label htmlFor={`dynamic_field_${index}`} className="text-sm font-medium">
                Field Name {index + 1}
              </Label>
              <Input
                id={`dynamic_field_${index}`}
                value={field.field_name}
                onChange={(e) => updateDynamicField(index, e.target.value)}
                placeholder="e.g., invoice_ref1, invoice_ref2"
                className="mt-1"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => removeDynamicField(index)}
              disabled={isLoading}
              className="text-red-600  self-end hover:text-red-700 hover:bg-red-50"
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
          type="submit"
        >
          Cancel
        </Button>
        <Button
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? 'Saving...' : (isEditing ? 'Update Customer' : 'Create Customer')}
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm; 