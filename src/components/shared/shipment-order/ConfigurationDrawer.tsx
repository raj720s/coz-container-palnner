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
    id: "basic",
    name: "Basic Information",
    description: "Core shipment order details"
  },
  {
    id: "shipping",
    name: "Shipping Details",
    description: "Port and transportation information"
  },
  {
    id: "cargo",
    name: "Cargo Information",
    description: "Cargo type and volume details"
  },
  {
    id: "dates",
    name: "Important Dates",
    description: "Key dates and timelines"
  },
  {
    id: "status",
    name: "Status & Tracking",
    description: "Order status and tracking information"
  }
];

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
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState("");

  // Load dynamic fields for selected customer
  useEffect(() => {
    if (selectedCustomerId) {
      const savedFields = getCustomerDynamicFieldsById(selectedCustomerId.toString());
      setDynamicFields(savedFields);
    } else {
      setDynamicFields([]);
    }
  }, [selectedCustomerId]);

  // Group columns by category
  const columnsByCategory = CATEGORIES.map(category => ({
    ...category,
    columns: columns.filter(col => col.category === category.id)
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
              SO Configuration
            </h2>
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
            {/* Column Visibility */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Column Visibility
              </h3>
              
              {columnsByCategory.map((category) => (
                <div key={category.id} className="mb-4">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
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
                    <div className="ml-4 space-y-2">
                      {category.columns.map((column) => (
                        <label
                          key={column.id}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={column.visible}
                            onChange={(e) => onColumnVisibilityChange(column.id, e.target.checked)}
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {column.label}
                          </span>
                        </label>
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
                  Configure Dynamic Fields
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Add custom text fields for this customer
                </p>
                
                {/* Add new field */}
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Field label"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={addDynamicField}
                    disabled={!newFieldLabel.trim()}
                    size="sm"
                    variant="outline"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                </div>

                {/* Dynamic fields list */}
                {dynamicFields.length > 0 && (
                  <div className="space-y-2">
                    {dynamicFields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                      >
                        <Input
                          value={field.label}
                          onChange={(e) => updateDynamicField(field.id, { label: e.target.value })}
                          className="flex-1 text-sm"
                        />
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
