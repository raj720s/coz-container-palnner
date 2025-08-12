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
  region: z.string().min(1, "Region is required"),
  type: z.enum(["POL", "POD"], { required_error: "Port type is required" }),
  isActive: z.boolean(),
});

type PortFormData = z.infer<typeof portSchema>;

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
      region: "",
      type: portType || "POL",
      isActive: true,
    },
  });

  const isActive = watch("isActive");
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
        region: "",
        type: portType || "POL",
        isActive: true,
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

  const regionOptions = [
    { value: "Asia Pacific", label: "Asia Pacific" },
    { value: "Europe", label: "Europe" },
    { value: "North America", label: "North America" },
    { value: "South America", label: "South America" },
    { value: "Africa", label: "Africa" },
    { value: "Middle East", label: "Middle East" },
    { value: "Oceania", label: "Oceania" },
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
          <Label>Region *</Label>
          <Select
            options={regionOptions}
            placeholder="Select region"
            value={watch("region")}
            onChange={(value) => setValue("region", value)}
            className={errors.region ? "border-red-500" : ""}
          />
          {errors.region && (
            <p className="mt-1.5 text-xs text-red-500">{errors.region.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
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
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Checkbox
            {...register("isActive")}
            checked={isActive}
            onChange={(e) => setValue("isActive", e.target.checked)}
          />
          <Label className="text-sm">Active</Label>
        </div>
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
            isEditing ? "Update Port" : "Create Port"
          )}
        </Button>
      </div>
    </form>
  );
}; 