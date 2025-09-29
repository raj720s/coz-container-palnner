"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Checkbox from "@/components/form/input/Checkbox";
import Button from "@/components/ui/button/Button";

const portSchema = z.object({
  code: z.string().min(1, "Port code is required"),
  name: z.string().min(1, "Port name is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  timezone: z.string().min(1, "Timezone is required"),
  type: z.enum(["POL", "POD"], { required_error: "Port type is required" }),
  is_active: z.boolean(),
});

export type PortFormData = z.infer<typeof portSchema>;

interface PortFormProps {
  initialData?: PortFormData & { id?: string };
  onSubmit: (data: PortFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  portType?: "POL" | "POD";
}

export const PortForm: React.FC<PortFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  portType,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PortFormData>({
    resolver: zodResolver(portSchema),
    defaultValues: {
      code: "",
      name: "",
      country: "",
      city: "",
      timezone: "",
      type: portType || "POL",
      is_active: true,
    },
  });

  const isActive = watch("is_active");
  const isEditing = !!initialData;
  const currentPortType = watch("type");

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        code: "",
        name: "",
        country: "",
        city: "",
        timezone: "",
        type: portType || "POL",
        is_active: true,
      });
    }
  }, [initialData, reset, portType]);

  const handleFormSubmit = (data: PortFormData) => {
    onSubmit(data);
  };

  const typeOptions = [
    { value: "POL", label: "Port of Loading" },
    { value: "POD", label: "Port of Discharge" },
  ];

  const timezoneOptions = [
    { value: "UTC", label: "UTC" },
    { value: "UTC+01:00", label: "UTC+01:00 (CET)" },
    { value: "UTC+02:00", label: "UTC+02:00 (EET)" },
    { value: "UTC+03:00", label: "UTC+03:00 (MSK)" },
    { value: "UTC+04:00", label: "UTC+04:00 (GST)" },
    { value: "UTC+05:00", label: "UTC+05:00" },
    { value: "UTC+05:30", label: "UTC+05:30 (IST)" },
    { value: "UTC+06:00", label: "UTC+06:00" },
    { value: "UTC+07:00", label: "UTC+07:00 (ICT)" },
    { value: "UTC+08:00", label: "UTC+08:00 (CST)" },
    { value: "UTC+09:00", label: "UTC+09:00 (JST)" },
    { value: "UTC+10:00", label: "UTC+10:00 (AEST)" },
    { value: "UTC+11:00", label: "UTC+11:00" },
    { value: "UTC+12:00", label: "UTC+12:00 (NZST)" },
    { value: "UTC-01:00", label: "UTC-01:00" },
    { value: "UTC-02:00", label: "UTC-02:00" },
    { value: "UTC-03:00", label: "UTC-03:00" },
    { value: "UTC-04:00", label: "UTC-04:00 (AST)" },
    { value: "UTC-05:00", label: "UTC-05:00 (EST)" },
    { value: "UTC-06:00", label: "UTC-06:00 (CST)" },
    { value: "UTC-07:00", label: "UTC-07:00 (MST)" },
    { value: "UTC-08:00", label: "UTC-08:00 (PST)" },
    { value: "UTC-09:00", label: "UTC-09:00" },
    { value: "UTC-10:00", label: "UTC-10:00" },
    { value: "UTC-11:00", label: "UTC-11:00" },
    { value: "UTC-12:00", label: "UTC-12:00" },
  ];

  const countryOptions = [
    { value: "China", label: "China" },
    { value: "USA", label: "United States" },
    { value: "Netherlands", label: "Netherlands" },
    { value: "Germany", label: "Germany" },
    { value: "United Kingdom", label: "United Kingdom" },
    { value: "Singapore", label: "Singapore" },
    { value: "Japan", label: "Japan" },
    { value: "South Korea", label: "South Korea" },
    { value: "India", label: "India" },
    { value: "Vietnam", label: "Vietnam" },
    { value: "Thailand", label: "Thailand" },
    { value: "Malaysia", label: "Malaysia" },
    { value: "Indonesia", label: "Indonesia" },
    { value: "Philippines", label: "Philippines" },
    { value: "France", label: "France" },
    { value: "Italy", label: "Italy" },
    { value: "Spain", label: "Spain" },
    { value: "Belgium", label: "Belgium" },
    { value: "Denmark", label: "Denmark" },
    { value: "Sweden", label: "Sweden" },
    { value: "Norway", label: "Norway" },
    { value: "Finland", label: "Finland" },
    { value: "Canada", label: "Canada" },
    { value: "Mexico", label: "Mexico" },
    { value: "Brazil", label: "Brazil" },
    { value: "Argentina", label: "Argentina" },
    { value: "Chile", label: "Chile" },
    { value: "Peru", label: "Peru" },
    { value: "Colombia", label: "Colombia" },
    { value: "Venezuela", label: "Venezuela" },
    { value: "South Africa", label: "South Africa" },
    { value: "Egypt", label: "Egypt" },
    { value: "Morocco", label: "Morocco" },
    { value: "Nigeria", label: "Nigeria" },
    { value: "Kenya", label: "Kenya" },
    { value: "Ghana", label: "Ghana" },
    { value: "Ethiopia", label: "Ethiopia" },
    { value: "Tanzania", label: "Tanzania" },
    { value: "Uganda", label: "Uganda" },
    { value: "Saudi Arabia", label: "Saudi Arabia" },
    { value: "UAE", label: "United Arab Emirates" },
    { value: "Qatar", label: "Qatar" },
    { value: "Kuwait", label: "Kuwait" },
    { value: "Bahrain", label: "Bahrain" },
    { value: "Oman", label: "Oman" },
    { value: "Jordan", label: "Jordan" },
    { value: "Lebanon", label: "Lebanon" },
    { value: "Israel", label: "Israel" },
    { value: "Turkey", label: "Turkey" },
    { value: "Iran", label: "Iran" },
    { value: "Iraq", label: "Iraq" },
    { value: "Syria", label: "Syria" },
    { value: "Yemen", label: "Yemen" },
    { value: "Australia", label: "Australia" },
    { value: "New Zealand", label: "New Zealand" },
    { value: "Fiji", label: "Fiji" },
    { value: "Papua New Guinea", label: "Papua New Guinea" },
    { value: "Solomon Islands", label: "Solomon Islands" },
    { value: "Vanuatu", label: "Vanuatu" },
    { value: "New Caledonia", label: "New Caledonia" },
    { value: "French Polynesia", label: "French Polynesia" },
    { value: "Samoa", label: "Samoa" },
    { value: "Tonga", label: "Tonga" },
    { value: "Cook Islands", label: "Cook Islands" },
    { value: "Niue", label: "Niue" },
    { value: "Tokelau", label: "Tokelau" },
    { value: "Tuvalu", label: "Tuvalu" },
    { value: "Kiribati", label: "Kiribati" },
    { value: "Marshall Islands", label: "Marshall Islands" },
    { value: "Micronesia", label: "Micronesia" },
    { value: "Palau", label: "Palau" },
    { value: "Nauru", label: "Nauru" },
    { value: "Other", label: "Other" },
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Port Code *</Label>
          <Input
            placeholder="e.g., CNSHA, USLAX, NLRTM"
            {...register("code")}
            error={errors.code?.message}
          />
        </div>
        <div>
          <Label>Port Name *</Label>
          <Input
            placeholder="e.g., Shanghai, Los Angeles, Rotterdam"
            {...register("name")}
            error={errors.name?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Country *</Label>
          <Select
            options={countryOptions}
            placeholder="Select country"
            value={watch("country")}
            onChange={(value) => setValue("country", value)}
            className={errors.country ? "border-red-500" : ""}
          />
          {errors.country && (
            <p className="mt-1.5 text-xs text-red-500">{errors.country.message}</p>
          )}
        </div>
        <div>
          <Label>City *</Label>
          <Input
            placeholder="e.g., Shanghai, Los Angeles, Rotterdam"
            {...register("city")}
            error={errors.city?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Timezone *</Label>
          <Select
            options={timezoneOptions}
            placeholder="Select timezone"
            value={watch("timezone")}
            onChange={(value) => setValue("timezone", value)}
            className={errors.timezone ? "border-red-500" : ""}
          />
          {errors.timezone && (
            <p className="mt-1.5 text-xs text-red-500">{errors.timezone.message}</p>
          )}
        </div>
        {/* <div>
          <Label>Port Type *</Label>
          <Select
            options={typeOptions}
            placeholder="Select port type"
            value={watch("type")}
            onChange={(value) => setValue("type", value as "POL" | "POD")}
            className={errors.type ? "border-red-500" : ""}
            disabled={!!portType} // Disable if portType is fixed
          />
          {errors.type && (
            <p className="mt-1.5 text-xs text-red-500">{errors.type.message}</p>
          )}
        </div> */}
      </div>

      <div className="flex items-center gap-3 pt-6">
        <Checkbox
          {...register("is_active")}
          checked={isActive}
          onChange={(e) => setValue("is_active", e.target.checked)}
        />
        <Label className="text-sm">Active</Label>
      </div>

      {errors.is_active && (
        <p className="text-xs text-red-500">{errors.is_active.message}</p>
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
            isEditing ? "Update Port" : "Create Port"
          )}
        </Button>
      </div>
    </form>
  );
}; 