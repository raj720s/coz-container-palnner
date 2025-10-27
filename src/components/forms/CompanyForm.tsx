"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/select/SelectField";
import CheckboxField from "@/components/form/checkbox/CheckboxField";
import { Company, CompanyFormData, COMPANY_TYPES, COUNTRIES } from "@/types/company";
import { companyService } from "@/services/companyService";

// Validation schema
const companySchema = z.object({
  name: z.string().min(1, "Company name is required").max(255, "Company name must be less than 255 characters"),
  short_name: z.string().max(50, "Short name must be less than 50 characters").optional(),
  company_type: z.union([z.literal(5), z.literal(10)]).refine(val => val === 5 || val === 10, {
    message: "Company type must be either 2PL (5) or 3PL (10)"
  }),
  country: z.string().max(100, "Country must be less than 100 characters").optional(),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  phone: z.string().max(50, "Phone must be less than 50 characters").optional(),
  parent_company: z.string().max(50, "Parent company must be less than 50 characters").optional(),
  is_third_party: z.boolean(),
  is_active: z.boolean(),
});

type CompanyFormSchema = z.infer<typeof companySchema>;

interface CompanyFormProps {
  initialData?: Company;
  onSuccess: () => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function CompanyForm({ initialData, onSuccess, onCancel, isEditing = false }: CompanyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CompanyFormSchema>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      short_name: "",
      company_type: 5,
      country: "",
      email: "",
      phone: "",
      parent_company: "",
      is_third_party: false,
      is_active: true,
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        short_name: initialData.short_name || "",
        company_type: (initialData.company_type === 5 || initialData.company_type === 10) ? initialData.company_type : 5,
        country: initialData.country || "",
        email: initialData.email,
        phone: initialData.phone || "",
        parent_company: initialData.parent_company || "",
        is_third_party: initialData.is_third_party,
        is_active: initialData.is_active,
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: CompanyFormSchema) => {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        await companyService.updateCompany(initialData.id, data);
        toast.success("Company updated successfully");
      } else {
        await companyService.createCompany(data);
        toast.success("Company created successfully");
      }
      onSuccess();
    } catch (error: any) {
      console.error("Error saving company:", error);
      toast.error(error?.response?.data?.message || "Failed to save company");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Name */}
        <div className="md:col-span-2">
          <Input
            label="Company Name *"
            placeholder="Enter company name"
            {...register("name")}
            error={errors.name?.message}
            required
          />
        </div>

        {/* Short Name */}
        <div>
          <Input
            label="Short Name"
            placeholder="Enter short name"
            {...register("short_name")}
            error={errors.short_name?.message}
          />
        </div>

        {/* Company Type */}
        <div>
          <Select
            label="Company Type *"
            placeholder="Select company type"
            {...register("company_type", { valueAsNumber: true })}
            error={errors.company_type?.message}
            required
          >
            {COMPANY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Email */}
        <div>
          <Input
            label="Email *"
            type="email"
            placeholder="Enter email address"
            {...register("email")}
            error={errors.email?.message}
            required
          />
        </div>

        {/* Phone */}
        <div>
          <Input
            label="Phone"
            placeholder="Enter phone number"
            {...register("phone")}
            error={errors.phone?.message}
          />
        </div>

        {/* Country */}
        <div>
          <Select
            label="Country"
            placeholder="Select country"
            {...register("country")}
            error={errors.country?.message}
          >
            <option value="">Select country</option>
            {COUNTRIES.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Parent Company */}
        <div>
          <Input
            label="Parent Company"
            placeholder="Enter parent company"
            {...register("parent_company")}
            error={errors.parent_company?.message}
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-4">
        <div className="flex items-center space-x-6">
          <CheckboxField
            label="Third Party Company"
            {...register("is_third_party")}
            error={errors.is_third_party?.message}
          />
          <CheckboxField
            label="Active"
            {...register("is_active")}
            error={errors.is_active?.message}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : (isEditing ? "Update" : "Save")}
        </Button>
      </div>
    </form>
  );
}

export type { CompanyFormData };
