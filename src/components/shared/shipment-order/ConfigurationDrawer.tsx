"use client";
import React, { useState, useEffect } from "react";
import { 
  getCustomerDynamicFieldsById, 
  saveCustomerDynamicFieldsById,
  type DynamicField 
} from "@/utils/customerDynamicFieldsUtils";
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  PlusIcon, 
  TrashBinIcon,
  XIcon
} from "@/icons";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import { useAuth } from "@/context/AuthContext";

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  category: string;
}

interface ConfigurationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomerId: number | null;
  columns: ColumnConfig[];
  onColumnVisibilityChange: (columnId: string, visible: boolean) => void;
  onDynamicFieldAdd: (field: DynamicField) => void;
  onDynamicFieldUpdate: (fieldId: string, updates: Partial<DynamicField>) => void;
  onDynamicFieldRemove: (fieldId: string) => void;
}

const CATEGORIES = [
  {
    id: "mandatory",
    name: "Mandatory Fields",
    description: "Required fields for all shipment orders (including equipment fields)",
    color: "text-red-600 dark:text-red-400"
  },
  {
    id: "optional",
    name: "Optional Fields",
    description: "Optional fields that can be shown/hidden",
    color: "text-blue-600 dark:text-blue-400"
  },
  {
    id: "dynamic",
    name: "Dynamic Fields",
    description: "Customer-specific custom fields",
    color: "text-purple-600 dark:text-purple-400"
  }
];

// Field definitions based on validation requirements
const FIELD_DEFINITIONS = {
  // Mandatory Fields
  vendor_booking_number: {
    id: "vendor_booking_number",
    label: "Vendor Booking (SO) Number",
    category: "mandatory",
    type: "uid",
    required: true,
    visible: true,
    description: "System-generated UID with fixed format"
  },
  vendor_booking_status: {
    id: "vendor_booking_status",
    label: "Vendor Booking Status",
    category: "mandatory",
    type: "choice",
    required: true,
    visible: true,
    description: "Draft | Confirmed | Shipped"
  },
  shipper: {
    id: "shipper",
    label: "Shipper",
    category: "mandatory",
    type: "text",
    required: true,
    visible: true,
    description: "Shipper information"
  },
  consignee: {
    id: "consignee",
    label: "Consignee",
    category: "mandatory",
    type: "text",
    required: true,
    visible: true,
    description: "Consignee information"
  },
  transportation_mode: {
    id: "transportation_mode",
    label: "Transportation Mode",
    category: "mandatory",
    type: "choice",
    required: true,
    visible: true,
    description: "FCL | LCL"
  },
  cargo_readiness_date: {
    id: "cargo_readiness_date",
    label: "Cargo Readiness Date",
    category: "mandatory",
    type: "date",
    required: true,
    visible: true,
    description: "Date when cargo will be ready"
  },
  service_type: {
    id: "service_type",
    label: "Service Type",
    category: "mandatory",
    type: "choice",
    required: true,
    visible: true,
    description: "CFS | CY"
  },
  volume: {
    id: "volume",
    label: "Volume",
    category: "mandatory",
    type: "numeric",
    required: true,
    visible: true,
    description: "Volume in CBM"
  },
  weight: {
    id: "weight",
    label: "Weight",
    category: "mandatory",
    type: "numeric",
    required: true,
    visible: true,
    description: "Weight in KG"
  },
  port_of_loading: {
    id: "port_of_loading",
    label: "Port of Loading",
    category: "mandatory",
    type: "text",
    required: true,
    visible: true,
    description: "Port where cargo is loaded"
  },
  port_of_discharge: {
    id: "port_of_discharge",
    label: "Port of Discharge",
    category: "mandatory",
    type: "text",
    required: true,
    visible: true,
    description: "Port where cargo is discharged"
  },
  customer: {
    id: "customer",
    label: "Customer",
    category: "mandatory",
    type: "choice",
    required: true,
    visible: true,
    description: "Customer from SupplyX"
  },
  vendor: {
    id: "vendor",
    label: "Vendor",
    category: "mandatory",
    type: "choice",
    required: true,
    visible: true,
    description: "Vendor from SupplyX Masterdata"
  },
  origin_partner: {
    id: "origin_partner",
    label: "Origin Partner",
    category: "mandatory",
    type: "choice",
    required: true,
    visible: true,
    description: "Origin Partner from SupplyX Masterdata"
  },

  // Optional Fields
  hs_code: {
    id: "hs_code",
    label: "HS Code",
    category: "optional",
    type: "text",
    required: false,
    visible: true,
    description: "Harmonized System Code"
  },
  cargo_description: {
    id: "cargo_description",
    label: "Cargo Description",
    category: "optional",
    type: "text",
    required: false,
    visible: true,
    description: "Description of the cargo"
  },
  marks_and_numbers: {
    id: "marks_and_numbers",
    label: "Marks & Numbers",
    category: "optional",
    type: "text",
    required: false,
    visible: true,
    description: "Cargo marks and numbers"
  },
  customer_reference: {
    id: "customer_reference",
    label: "Customer Reference",
    category: "optional",
    type: "text",
    required: false,
    visible: true,
    description: "Customer reference number"
  },
  cargo_type: {
    id: "cargo_type",
    label: "Cargo Type",
    category: "optional",
    type: "choice",
    required: false,
    visible: false,
    description: "Normal | Reefer | Dangerous Goods"
  },
  dangerous_goods_notes: {
    id: "dangerous_goods_notes",
    label: "Dangerous Goods Notes",
    category: "optional",
    type: "text",
    required: false,
    visible: true,
    description: "Required only if Cargo Type = Dangerous Goods"
  },
  place_of_receipt: {
    id: "place_of_receipt",
    label: "Place of Receipt",
    category: "optional",
    type: "text",
    required: false,
    visible: true,
    description: "Place where cargo is received"
  },
  place_of_delivery: {
    id: "place_of_delivery",
    label: "Place of Delivery",
    category: "optional",
    type: "text",
    required: false,
    visible: true,
    description: "Place where cargo is delivered"
  },
  carrier: {
    id: "carrier",
    label: "Carrier",
    category: "optional",
    type: "text",
    required: false,
    visible: true,
    description: "Carrier information"
  },
  carrier_booking_number: {
    id: "carrier_booking_number",
    label: "Carrier Booking Number",
    category: "optional",
    type: "text",
    required: false,
    visible: true,
    description: "Carrier's booking reference"
  },

  // Equipment Fields (Moved to Mandatory as they are required)
  equipment_count: {
    id: "equipment_count",
    label: "Equipment #",
    category: "mandatory",
    type: "numeric",
    required: true,
    visible: true,
    description: "Number of equipment units (required for 'Shipped' status)"
  },
  equipment_size_type: {
    id: "equipment_size_type",
    label: "Equipment Size/Type",
    category: "mandatory",
    type: "choice",
    required: true,
    visible: true,
    description: "Container size and type (required for 'Shipped' status)"
  },
  equipment_numbers: {
    id: "equipment_numbers",
    label: "Equipment Numbers",
    category: "mandatory",
    type: "text",
    required: true,
    visible: true,
    description: "Equipment numbers (dependent on Equipment #, required for 'Shipped' status)"
  }
};

export const ConfigurationDrawer: React.FC<ConfigurationDrawerProps> = ({
  isOpen,
  onClose,
  selectedCustomerId,
  columns,
  onColumnVisibilityChange,
  onDynamicFieldAdd,
  onDynamicFieldUpdate,
  onDynamicFieldRemove
}) => {
  const { user } = useAuth();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState("");

  // Role-based visibility
  const isVendor = user?.role === 'user'; // Regular users are treated as vendors for field access
  const isAdmin = user?.role === 'admin';

  // Load dynamic fields for selected customer
  useEffect(() => {
    if (selectedCustomerId) {
      const savedFields = getCustomerDynamicFieldsById(selectedCustomerId.toString());
      setDynamicFields(savedFields);
    } else {
      setDynamicFields([]);
    }
  }, [selectedCustomerId]);

  // Create field definitions with current visibility state
  const getFieldDefinitions = () => {
    return Object.values(FIELD_DEFINITIONS).map(field => ({
      ...field,
      visible: columns.find(col => col.id === field.id)?.visible ?? field.visible
    }));
  };

  // Group fields by category
  // Filter categories based on user role
  // Vendors (regular users) can only configure Optional fields
  // Admins can configure all field categories (Mandatory, Optional, Dynamic)
  const visibleCategories = isVendor 
    ? CATEGORIES.filter(cat => cat.id === 'optional') // Vendors only see Optional fields
    : CATEGORIES; // Admins see all categories

  const fieldsByCategory = visibleCategories.map(category => ({
    ...category,
    fields: getFieldDefinitions().filter(field => field.category === category.id)
  }));

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const addDynamicField = () => {
    if (newFieldLabel.trim() && selectedCustomerId) {
      const newField: DynamicField = {
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: newFieldLabel.trim(),
        value: '',
      };
      
      const updatedFields = [...dynamicFields, newField];
      setDynamicFields(updatedFields);
      saveCustomerDynamicFieldsById(selectedCustomerId.toString(), updatedFields);
      onDynamicFieldAdd(newField);
      setNewFieldLabel("");
    }
  };

  const updateDynamicField = (fieldId: string, updates: Partial<DynamicField>) => {
    const updatedFields = dynamicFields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );
    setDynamicFields(updatedFields);
    if (selectedCustomerId) {
      saveCustomerDynamicFieldsById(selectedCustomerId.toString(), updatedFields);
    }
    onDynamicFieldUpdate(fieldId, updates);
  };

  const removeDynamicField = (fieldId: string) => {
    const updatedFields = dynamicFields.filter(field => field.id !== fieldId);
    setDynamicFields(updatedFields);
    if (selectedCustomerId) {
      saveCustomerDynamicFieldsById(selectedCustomerId.toString(), updatedFields);
    }
    onDynamicFieldRemove(fieldId);
  };

  const drawerClasses = `fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out z-50 ${
    isOpen ? 'translate-x-0' : 'translate-x-full'
  }`;

  return (
    <div 
      className={drawerClasses}
      style={{ 
        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
        backgroundColor: 'white'
      }}
    >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              SO Field Configuration
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isVendor 
                ? "Configure optional field visibility for shipment orders" 
                : "Configure field visibility and dynamic fields for shipment orders"
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto thin-scrollbar h-[calc(100vh-80px)]">
          <div className="p-4 space-y-6">
            {/* Field Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Field Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Mandatory Fields:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {fieldsByCategory.find(cat => cat.id === 'mandatory')?.fields.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Optional Fields:</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {fieldsByCategory.find(cat => cat.id === 'optional')?.fields.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Dynamic Fields:</span>
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    {dynamicFields.length}/5
                  </span>
                </div>
              </div>
            </div>

            {/* Field Configuration */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Field Configuration
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Configure which fields are visible in the table. Mandatory fields cannot be hidden.
              </p>
              
              {fieldsByCategory.map((category) => (
                <div key={category.id} className="mb-4">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="flex items-center justify-between w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
                  >
                    <div>
                      <div className={`text-sm font-medium ${category.color}`}>
                        {category.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {category.description}
                      </div>
                    </div>
                    {expandedCategories.includes(category.id) ? (
                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedCategories.includes(category.id) && (
                    <div className="ml-4 space-y-2 mt-2">
                      {category.fields.map((field) => (
                        <div
                          key={field.id}
                          className="flex items-start space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                        >
                          <div className="flex items-center space-x-2 flex-1">
                            <Checkbox
                              checked={field.visible}
                              onChange={(e) => onColumnVisibilityChange(field.id, e.target.checked)}
                              disabled={field.required && category.id === "mandatory"}
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {field.label}
                                </span>
                                {field.required && (
                                  <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-0.5 rounded">
                                    Required
                                  </span>
                                )}
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  field.type === 'choice' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  field.type === 'numeric' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  field.type === 'date' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                  field.type === 'uid' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                                }`}>
                                  {field.type.toUpperCase()}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {field.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Dynamic Fields Configuration */}
            {selectedCustomerId && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Dynamic Fields (Customer-Specific)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Add up to 5 custom text fields for this customer. These fields are adjustable per client to accommodate client-specific references.
                </p>
                
                {/* Add new field */}
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Field label (e.g., Customer Reference, Special Instructions)"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    className="flex-1"
                    disabled={dynamicFields.length >= 5}
                  />
                  <Button
                    onClick={addDynamicField}
                    disabled={!newFieldLabel.trim() || dynamicFields.length >= 5}
                    size="sm"
                    variant="outline"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                </div>

                {/* Field count indicator */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {dynamicFields.length} of 5 fields configured
                </div>

                {/* Dynamic fields list */}
                {dynamicFields.length > 0 && (
                  <div className="space-y-2">
                    {dynamicFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md border border-purple-200 dark:border-purple-700"
                      >
                        <div className="flex items-center space-x-2 flex-1">
                          <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-0.5 rounded">
                            Field {index + 1}
                          </span>
                          <Input
                            value={field.label}
                            onChange={(e) => updateDynamicField(field.id, { label: e.target.value })}
                            className="flex-1 text-sm"
                            placeholder="Enter field label"
                          />
                        </div>
                        <Button
                          onClick={() => removeDynamicField(field.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <TrashBinIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {dynamicFields.length === 0 && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No dynamic fields configured yet</p>
                    <p className="text-xs mt-1">Add custom fields to capture client-specific information</p>
                  </div>
                )}
              </div>
            )}

            {!selectedCustomerId && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-sm">Select a customer to configure dynamic fields</p>
              </div>
            )}
          </div>
        </div>
      </div>
    
  );
};
