"use client";
import React, { useEffect, useState } from "react";
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
  EQUIPMENT_SIZE_TYPE_OPTIONS,
  CustomerReference,
  VendorReference,
  OriginPartnerReference,
  CustomerDynamicField
} from "@/types/shipmentOrder";
import { 
  getCustomerDynamicFieldsById,
  type DynamicField 
} from "@/utils/customerDynamicFieldsUtils";
import { shipmentOrderService } from "@/services/shipmentOrderService";
import { PlusIcon, TrashBinIcon } from "@/icons";

// Form validation schema
const shipmentOrderSchema = z.object({
  shipper: z.string().min(1, "Shipper is required"),
  consignee: z.string().min(1, "Consignee is required"),
  transportation_mode: z.enum(["FCL", "LCL"], { required_error: "Transportation mode is required" }),
  cargo_readiness_date: z.string().min(1, "Cargo readiness date is required"),
  service_type: z.enum(["CFS", "CY"], { required_error: "Service type is required" }),
  volume: z.number().min(0.01, "Volume must be greater than 0"),
  weight: z.number().min(0.01, "Weight must be greater than 0"),
  hs_code: z.string().optional(),
  cargo_description: z.string().optional(),
  marks_numbers: z.string().optional(),
  customer_reference: z.string().optional(),
  cargo_type: z.enum(["Normal", "Reefer", "Dangerous Goods"]).optional(),
  dangerous_goods_notes: z.string().optional(),
  place_of_receipt: z.string().optional(),
  port_of_loading: z.string().min(1, "Port of loading is required"),
  port_of_discharge: z.string().min(1, "Port of discharge is required"),
  place_of_delivery: z.string().optional(),
  carrier: z.string().optional(),
  carrier_booking_number: z.string().optional(),
  equipment_count: z.number().min(1, "Equipment count must be at least 1"),
  equipment_size_type: z.string().min(1, "Equipment size/type is required"),
  equipment_numbers: z.array(z.string()).min(1, "At least one equipment number is required"),
  user_defined_field1: z.string().optional(),
  user_defined_field2: z.string().optional(),
  user_defined_field3: z.string().optional(),
  user_defined_field4: z.string().optional(),
  user_defined_field5: z.string().optional(),
  customer_id: z.string().min(1, "Customer is required"),
  vendor_id: z.string().min(1, "Vendor is required"),
  origin_partner_id: z.string().min(1, "Origin partner is required"),
}).refine((data) => {
  if (data.cargo_type === "Dangerous Goods" && !data.dangerous_goods_notes?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Dangerous goods notes are required when cargo type is Dangerous Goods",
  path: ["dangerous_goods_notes"],
}).refine((data) => {
  return data.equipment_numbers.length === data.equipment_count;
}, {
  message: "Number of equipment numbers must match equipment count",
  path: ["equipment_numbers"],
});

export type ShipmentOrderFormSchema = z.infer<typeof shipmentOrderSchema>;

interface ShipmentOrderFormProps {
  initialData?: ShipmentOrderFormData & { id?: string };
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
  const [customers, setCustomers] = useState<CustomerReference[]>([]);
  const [vendors, setVendors] = useState<VendorReference[]>([]);
  const [originPartners, setOriginPartners] = useState<OriginPartnerReference[]>([]);
  const [customerDynamicFields, setCustomerDynamicFields] = useState<CustomerDynamicField[]>([]);
  const [isClient, setIsClient] = useState(false);

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
      transportation_mode: "FCL",
      cargo_readiness_date: "",
      service_type: "CY",
      volume: 0,
      weight: 0,
      port_of_loading: "",
      port_of_discharge: "",
      equipment_count: 1,
      equipment_size_type: "20FT",
      equipment_numbers: [""],
      customer_id: "",
      vendor_id: "",
      origin_partner_id: "",
    },
  });

  const isEditing = !!initialData;
  const selectedCustomerId = watch("customer_id");
  const equipmentCount = watch("equipment_count");
  const cargoType = watch("cargo_type");
  const serviceType = watch("service_type");

  // Load master data
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [customersData, vendorsData, partnersData] = await Promise.all([
          shipmentOrderService.getCustomers(),
          shipmentOrderService.getVendors(),
          shipmentOrderService.getOriginPartners(),
        ]);
        setCustomers(customersData);
        setVendors(vendorsData);
        setOriginPartners(partnersData);
      } catch (error) {
        console.error("Failed to load master data:", error);
      }
    };

    loadMasterData();
  }, []);

  // Load customer dynamic fields when customer changes
  useEffect(() => {
    if (selectedCustomerId && isClient) {
      const dynamicFields = getCustomerDynamicFieldsById(selectedCustomerId);
      setCustomerDynamicFields(dynamicFields);
    } else {
      setCustomerDynamicFields([]);
    }
  }, [selectedCustomerId, isClient]);

  // Initialize form data
  useEffect(() => {
    setIsClient(true);
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  // Update equipment numbers when equipment count changes
  useEffect(() => {
    const currentEquipmentNumbers = watch("equipment_numbers");
    const newEquipmentNumbers = Array(equipmentCount).fill("").map((_, index) => 
      currentEquipmentNumbers[index] || ""
    );
    setValue("equipment_numbers", newEquipmentNumbers);
  }, [equipmentCount, setValue, watch]);

  const handleFormSubmit = (data: ShipmentOrderFormSchema) => {
    onSubmit(data);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      window.history.back();
    }
  };

  const updateEquipmentNumber = (index: number, value: string) => {
    const currentNumbers = watch("equipment_numbers");
    const newNumbers = [...currentNumbers];
    newNumbers[index] = value;
    setValue("equipment_numbers", newNumbers);
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
            <Label htmlFor="marks_numbers">Marks & Numbers</Label>
            <Input
              id="marks_numbers"
              {...register("marks_numbers")}
              placeholder="Enter marks and numbers"
              error={errors.marks_numbers?.message}
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

        {cargoType === "Dangerous Goods" && (
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
          <div>
            <Label htmlFor="place_of_receipt">Place of Receipt</Label>
            <Input
              id="place_of_receipt"
              {...register("place_of_receipt")}
              placeholder="Enter place of receipt"
              error={errors.place_of_receipt?.message}
            />
          </div>
          <div>
            <Label htmlFor="port_of_loading" required>Port of Loading</Label>
            <Input
              id="port_of_loading"
              {...register("port_of_loading")}
              placeholder="Enter port of loading"
              error={errors.port_of_loading?.message}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <Label htmlFor="port_of_discharge" required>Port of Discharge</Label>
            <Input
              id="port_of_discharge"
              {...register("port_of_discharge")}
              placeholder="Enter port of discharge"
              error={errors.port_of_discharge?.message}
            />
          </div>
          <div>
            <Label htmlFor="place_of_delivery">Place of Delivery</Label>
            <Input
              id="place_of_delivery"
              {...register("place_of_delivery")}
              placeholder="Enter place of delivery"
              error={errors.place_of_delivery?.message}
            />
          </div>
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

      {/* Container Assignment - Only show for CY or CFS service types */}
      {(serviceType === "CY" || serviceType === "CFS") && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Container Assignment</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="equipment_count" required>Equipment Count</Label>
              <Input
                id="equipment_count"
                type="number"
                min="1"
                {...register("equipment_count", { valueAsNumber: true })}
                placeholder="Enter equipment count"
                error={errors.equipment_count?.message}
              />
            </div>
            <div>
              <Label htmlFor="equipment_size_type" required>Equipment Size/Type</Label>
              <select
                id="equipment_size_type"
                {...register("equipment_size_type")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white"
              >
                {EQUIPMENT_SIZE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.equipment_size_type && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.equipment_size_type.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <Label required>Equipment Numbers</Label>
            <div className="space-y-3">
              {Array.from({ length: equipmentCount }, (_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Input
                    value={watch(`equipment_numbers.${index}`) || ""}
                    onChange={(e) => updateEquipmentNumber(index, e.target.value)}
                    placeholder={`Equipment number ${index + 1}`}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
            {errors.equipment_numbers && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.equipment_numbers.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Master Data References */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Master Data References</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="customer_id" required>Customer</Label>
            <select
              id="customer_id"
              {...register("customer_id")}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.customer_code})
                </option>
              ))}
            </select>
            {errors.customer_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.customer_id.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="vendor_id" required>Vendor</Label>
            <select
              id="vendor_id"
              {...register("vendor_id")}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name} ({vendor.vendor_code})
                </option>
              ))}
            </select>
            {errors.vendor_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.vendor_id.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="origin_partner_id" required>Origin Partner</Label>
            <select
              id="origin_partner_id"
              {...register("origin_partner_id")}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select origin partner</option>
              {originPartners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.name} ({partner.partner_code})
                </option>
              ))}
            </select>
            {errors.origin_partner_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.origin_partner_id.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Customer Dynamic Fields */}
      {isClient && customerDynamicFields.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer Custom Fields</h3>
          
          <div className="space-y-4">
            {customerDynamicFields.map((field, index) => (
              <div key={field.id}>
                <Label htmlFor={`user_defined_field${index + 1}`}>
                  {field.label}
                </Label>
                <Input
                  id={`user_defined_field${index + 1}`}
                  {...register(`user_defined_field${index + 1}` as keyof ShipmentOrderFormSchema)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  defaultValue={field.value}
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
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : (isEditing ? 'Update Shipment Order' : 'Create Shipment Order')}
        </Button>
      </div>
    </form>
  );
};

export default ShipmentOrderForm;
