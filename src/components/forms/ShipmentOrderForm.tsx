"use client";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { 
  ShipmentOrderFormData, 
  ShipmentOrderStatus,
  TransportationMode,
  ServiceType,
  CargoType,
  SHIPMENT_ORDER_STATUS_OPTIONS,
  TRANSPORTATION_MODE_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  CARGO_TYPE_OPTIONS,
  CustomerDynamicField
} from "@/types/shipmentOrder";
import { 
  getCustomerDynamicFieldsById,
  type DynamicField 
} from "@/utils/customerDynamicFieldsUtils";
import { shipmentOrderService } from "@/services/shipmentOrderService";
import { polService } from "@/services/polService";
import { podService } from "@/services/podService";
import { customerService } from "@/services/customerService";
import { POLResponse, PODResponse, CustomerResponse } from "@/types/api";
import SearchableSelect from "@/components/form/input/SearchableSelect";
import { PlusIcon, TrashBinIcon } from "@/icons";

// Form validation schema
const shipmentOrderSchema = z.object({
  shipper: z.string().min(1, "Shipper is required"),
  consignee: z.string().min(1, "Consignee is required"),
  transportation_mode: z.enum(["ocean", "air", "road", "rail"]).optional(),
  cargo_readiness_date: z.string()
    .min(1, "Cargo readiness date is required")
    .refine((date) => {
      if (!date) return false;
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, "Please enter a valid date"),
  service_type: z.enum(["cy", "cfs"], { required_error: "Service type is required" }),
  volume: z.number().min(0.01, "Volume must be greater than 0"),
  weight: z.number().min(0.01, "Weight must be greater than 0"),
  hs_code: z.string().min(1, "HS Code is required"),
  cargo_description: z.string().optional(),
  marks_and_numbers: z.string().optional(),
  customer_reference: z.string().optional(),
  cargo_type: z.enum(["normal", "reefer", "dg"]).optional(),
  dangerous_goods_notes: z.string().optional(),
  place_of_receipt: z.string().optional(),
  place_of_delivery: z.string().optional(),
  carrier: z.string().optional(),
  carrier_booking_number: z.string().optional(),
  customer: z.number().min(1, "Customer is required"),
}).refine((data) => {
  if (data.cargo_type === "dg" && !data.dangerous_goods_notes?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Dangerous goods notes are required when cargo type is Dangerous Goods",
  path: ["dangerous_goods_notes"],
});

export type ShipmentOrderFormSchema = z.infer<typeof shipmentOrderSchema>;

interface ShipmentOrderFormProps {
  initialData?: ShipmentOrderFormData;
  onSubmit: (data: ShipmentOrderFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const ShipmentOrderForm: React.FC<ShipmentOrderFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [customerDynamicFields, setCustomerDynamicFields] = useState<CustomerDynamicField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<{[key: string]: string}>({});
  const [isClient, setIsClient] = useState(false);
  const [isLoadingCustomerFields, setIsLoadingCustomerFields] = useState(false);
  
  // Cache for customer data to prevent redundant API calls
  const customerCacheRef = useRef<Map<number, CustomerResponse>>(new Map());
  const loadingCustomerRef = useRef<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ShipmentOrderFormSchema>({
    resolver: zodResolver(shipmentOrderSchema),
    defaultValues: {
      shipper: "",
      consignee: "",
      transportation_mode: "ocean",
      cargo_readiness_date: "",
      service_type: "cy",
      volume: 0,
      weight: 0,
      hs_code: "",
      cargo_description: "",
      marks_and_numbers: "",
      customer_reference: "",
      place_of_receipt: "",
      place_of_delivery: "",
      carrier: "",
      carrier_booking_number: "",
      customer: 0,
    },
  });

  const isEditing = !!initialData?.id; // ✅ Check for id, not just initialData
  const selectedCustomerId = watch("customer");
  const cargoType = watch("cargo_type");

  // Load customer dynamic fields when customer changes (optimized with caching)
  useEffect(() => {
    const loadCustomerDynamicFields = async () => {
      if (!selectedCustomerId || !isClient) {
        setCustomerDynamicFields([]);
        return;
      }

      // Prevent duplicate calls for the same customer
      if (loadingCustomerRef.current === selectedCustomerId) {
        return;
      }

      // Check cache first
      const cachedCustomer = customerCacheRef.current.get(selectedCustomerId);
      if (cachedCustomer) {
        // Use cached data
        if (cachedCustomer.custom_fields && cachedCustomer.custom_fields.length > 0) {
          const dynamicFields: CustomerDynamicField[] = cachedCustomer.custom_fields.map((field) => ({
            id: field.id.toString(),
            label: field.name,
            value: ''
          }));
          setCustomerDynamicFields(dynamicFields);
        } else {
          setCustomerDynamicFields([]);
        }
        return;
      }

      // Load from API
      try {
        setIsLoadingCustomerFields(true);
        loadingCustomerRef.current = selectedCustomerId;
        
        const customer = await customerService.getCustomer(selectedCustomerId);
        
        // Cache the customer data
        customerCacheRef.current.set(selectedCustomerId, customer);
        
        // Map custom_fields from API to CustomerDynamicField format
        if (customer.custom_fields && customer.custom_fields.length > 0) {
          const dynamicFields: CustomerDynamicField[] = customer.custom_fields.map((field) => ({
            id: field.id.toString(),
            label: field.name,
            value: ''
          }));
          setCustomerDynamicFields(dynamicFields);
        } else {
          setCustomerDynamicFields([]);
        }
      } catch (error) {
        console.error("Failed to load customer dynamic fields:", error);
        setCustomerDynamicFields([]);
      } finally {
        setIsLoadingCustomerFields(false);
        loadingCustomerRef.current = null;
      }
    };

    loadCustomerDynamicFields();
  }, [selectedCustomerId, isClient]);

  // Initialize form data
  useEffect(() => {
    setIsClient(true);
    if (initialData) {
      console.log("Initializing form with data:", initialData);
      console.log("Cargo readiness date:", initialData.cargo_readiness_date);
      
      // Transform date to YYYY-MM-DD format for HTML date input
      const transformedData = {
        ...initialData,
        cargo_readiness_date: initialData.cargo_readiness_date 
          ? (() => {
              try {
                const date = new Date(initialData.cargo_readiness_date);
                if (isNaN(date.getTime())) {
                  console.warn("Invalid date format:", initialData.cargo_readiness_date);
                  return initialData.cargo_readiness_date;
                }
                return date.toISOString().split('T')[0];
              } catch (error) {
                console.warn("Error parsing date:", error);
                return initialData.cargo_readiness_date;
              }
            })()
          : initialData.cargo_readiness_date
      };
      
      console.log("Transformed data:", transformedData);
      reset(transformedData);

      // Load customer fields and populate custom field values if editing
      const loadInitialCustomerData = async () => {
        if (initialData.customer) {
          try {
            // Check cache first
            let customer = customerCacheRef.current.get(initialData.customer);
            
            // Load from API if not cached
            if (!customer) {
              setIsLoadingCustomerFields(true);
              customer = await customerService.getCustomer(initialData.customer);
              customerCacheRef.current.set(initialData.customer, customer);
              setIsLoadingCustomerFields(false);
            }

            // Set customer dynamic fields
            if (customer.custom_fields && customer.custom_fields.length > 0) {
              const dynamicFields: CustomerDynamicField[] = customer.custom_fields.map((field) => ({
                id: field.id.toString(),
                label: field.name,
                value: ''
              }));
              setCustomerDynamicFields(dynamicFields);
            }

            // Populate custom field values from initialData
            if (initialData.custom_field_values && initialData.custom_field_values.length > 0) {
              const fieldValuesMap: {[key: string]: string} = {};
              initialData.custom_field_values.forEach(cfv => {
                fieldValuesMap[cfv.field.toString()] = cfv.value;
              });
              setCustomFieldValues(fieldValuesMap);
            }
          } catch (error) {
            console.error("Failed to load customer data for edit:", error);
            setIsLoadingCustomerFields(false);
          }
        }
      };

      loadInitialCustomerData();
    }
  }, [initialData, reset]);


  // Search functions for dropdowns
  const searchPOLs = async (query: string): Promise<POLResponse[]> => {
    try {
      return await polService.searchPOLs(query, 10);
    } catch (error) {
      console.error("Failed to search POLs:", error);
      return [];
    }
  };

  const searchPODs = async (query: string): Promise<PODResponse[]> => {
    try {
      return await podService.searchPODs(query, 10);
    } catch (error) {
      console.error("Failed to search PODs:", error);
      return [];
    }
  };

  const searchCustomers = async (query: string): Promise<CustomerResponse[]> => {
    try {
      return await customerService.searchCustomers(query);
    } catch (error) {
      console.error("Failed to search customers:", error);
      return [];
    }
  };

  // Memoize custom field value handler to prevent re-renders
  const handleCustomFieldChange = useCallback((fieldId: string, value: string) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  }, []);

  // Memoize form submission handler
  const handleFormSubmit = useCallback((data: ShipmentOrderFormSchema) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", errors);
    
    // Build custom_field_values array from customFieldValues state
    const custom_field_values = customerDynamicFields
      .filter(field => customFieldValues[field.id]?.trim())
      .map(field => ({
        field: parseInt(field.id),
        value: customFieldValues[field.id]
      }));
    
    // Transform date to ISO format for API
    const transformedData = {
      ...data,
      cargo_readiness_date: data.cargo_readiness_date 
        ? (() => {
            try {
              const date = new Date(data.cargo_readiness_date);
              if (isNaN(date.getTime())) {
                console.warn("Invalid date format for submission:", data.cargo_readiness_date);
                return data.cargo_readiness_date;
              }
              return date.toISOString();
            } catch (error) {
              console.warn("Error parsing date for submission:", error);
              return data.cargo_readiness_date;
            }
          })()
        : data.cargo_readiness_date,
      custom_field_values: custom_field_values.length > 0 ? custom_field_values : undefined
    };
    
    console.log("Transformed data for API:", transformedData);
    onSubmit(transformedData);
  }, [customerDynamicFields, customFieldValues, errors, onSubmit]);

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      window.history.back();
    }
  };


  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="shipper" required>Shipper</Label>
            <Input
              id="shipper"
              {...register("shipper")}
              placeholder="Enter shipper name"
              error={errors.shipper?.message}
            />
          </div>
          <div>
            <Label htmlFor="consignee" required>Consignee</Label>
            <Input
              id="consignee"
              {...register("consignee")}
              placeholder="Enter consignee name"
              error={errors.consignee?.message}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <Label htmlFor="transportation_mode" required>Transportation Mode</Label>
            <select
              id="transportation_mode"
              {...register("transportation_mode")}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white"
            >
              {TRANSPORTATION_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.transportation_mode && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.transportation_mode.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="cargo_readiness_date" required>Cargo Readiness Date</Label>
            <Input
              id="cargo_readiness_date"
              type="date"
              {...register("cargo_readiness_date")}
              error={errors.cargo_readiness_date?.message}
            />
          </div>
          <div>
            <Label htmlFor="service_type" required>Service Type</Label>
            <select
              id="service_type"
              {...register("service_type")}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white"
            >
              {SERVICE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.service_type && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.service_type.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <Label htmlFor="volume" required>Volume</Label>
            <Input
              id="volume"
              type="number"
              step="0.01"
              {...register("volume", { valueAsNumber: true })}
              placeholder="Enter volume"
              error={errors.volume?.message}
            />
          </div>
          <div>
            <Label htmlFor="weight" required>Weight</Label>
            <Input
              id="weight"
              type="number"
              step="0.01"
              {...register("weight", { valueAsNumber: true })}
              placeholder="Enter weight"
              error={errors.weight?.message}
            />
          </div>
        </div>
      </div>

      {/* Cargo Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cargo Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="hs_code">HS Code</Label>
            <Input
              id="hs_code"
              {...register("hs_code")}
              placeholder="Enter HS code"
              error={errors.hs_code?.message}
            />
          </div>
          <div>
            <Label htmlFor="cargo_type">Cargo Type</Label>
            <select
              id="cargo_type"
              {...register("cargo_type")}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select cargo type</option>
              {CARGO_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.cargo_type && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.cargo_type.message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <Label htmlFor="cargo_description">Cargo Description</Label>
          <textarea
            id="cargo_description"
            {...register("cargo_description")}
            placeholder="Enter cargo description"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white"
            rows={3}
          />
          {errors.cargo_description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.cargo_description.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <Label htmlFor="marks_and_numbers">Marks & Numbers</Label>
            <Input
              id="marks_and_numbers"
              {...register("marks_and_numbers")}
              placeholder="Enter marks and numbers"
              error={errors.marks_and_numbers?.message}
            />
          </div>
          <div>
            <Label htmlFor="customer_reference">Customer Reference</Label>
            <Input
              id="customer_reference"
              {...register("customer_reference")}
              placeholder="Enter customer reference"
              error={errors.customer_reference?.message}
            />
          </div>
        </div>

        {cargoType === "dg" && (
          <div className="mt-6">
            <Label htmlFor="dangerous_goods_notes" required>Dangerous Goods Notes</Label>
            <textarea
              id="dangerous_goods_notes"
              {...register("dangerous_goods_notes")}
              placeholder="Enter dangerous goods notes"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white"
              rows={3}
            />
            {errors.dangerous_goods_notes && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.dangerous_goods_notes.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Location Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Location Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SearchableSelect
            id="place_of_receipt"
            label="Place of Receipt"
            placeholder="Search for place of receipt"
            value={watch("place_of_receipt") || null}
            onChange={(value) => setValue("place_of_receipt", value as string)}
            onSearch={searchPOLs}
            error={errors.place_of_receipt?.message}
            displayFormat={(option) => `${option.name} (${option.code})`}
            searchPlaceholder="Search places of receipt..."
            valueExtractor={(option) => option.name}
          />
          <SearchableSelect
            id="place_of_delivery"
            label="Place of Delivery"
            placeholder="Search for place of delivery"
            value={watch("place_of_delivery") || null}
            onChange={(value) => setValue("place_of_delivery", value as string)}
            onSearch={searchPODs}
            error={errors.place_of_delivery?.message}
            displayFormat={(option) => `${option.name} (${option.code})`}
            searchPlaceholder="Search places of delivery..."
            valueExtractor={(option) => option.name}
          />
        </div>
      </div>

      {/* Carrier Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Carrier Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="carrier">Carrier</Label>
            <Input
              id="carrier"
              {...register("carrier")}
              placeholder="Enter carrier name"
              error={errors.carrier?.message}
            />
          </div>
          <div>
            <Label htmlFor="carrier_booking_number">Carrier Booking Number</Label>
            <Input
              id="carrier_booking_number"
              {...register("carrier_booking_number")}
              placeholder="Enter carrier booking number"
              error={errors.carrier_booking_number?.message}
            />
          </div>
        </div>
      </div>

      {/* Master Data References */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Master Data References</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <SearchableSelect
            id="customer"
            label="Customer"
            required
            placeholder="Search for customer"
            value={watch("customer")}
            onChange={(value) => setValue("customer", value as number)}
            onSearch={searchCustomers}
            error={errors.customer?.message}
            displayFormat={(option) => `${option.name} (${option.customer_code || option.code})`}
            searchPlaceholder="Search customers..."
          />
        </div>
      </div>

      {/* Customer Dynamic Fields */}
      {isClient && customerDynamicFields.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Customer Custom Fields
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            These fields are specific to the selected customer
          </p>
          
          <div className="space-y-4">
            {customerDynamicFields.map((field, index) => (
              <div key={field.id}>
                <Label htmlFor={`custom_field_${field.id}`}>
                  {field.label}
                </Label>
                <Input
                  id={`custom_field_${field.id}`}
                  value={customFieldValues[field.id] || ''}
                  onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  disabled={isLoadingCustomerFields}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : (isEditing ? 'Update Shipment Order' : 'Create Shipment Order')}
        </Button>
      </div>
    </form>
  );
};

export default ShipmentOrderForm;
