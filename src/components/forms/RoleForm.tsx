"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { CreateRoleRequest, UpdateRoleRequest, PrivilegeResponse, PrivilegeItem } from "@/services/roleService";
import toast from "react-hot-toast";

const roleSchema = z.object({
  role_name: z.string().min(2, "Role name must be at least 2 characters"),
  role_description: z.string().min(10, "Role description must be at least 10 characters"),
  privilege_names: z.array(z.string()).min(1, "At least one privilege must be selected"),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormProps {
  initialData?: {
    id: string;
    role_name: string;
    role_description: string;
    privilege_names: string[];
  };
  privileges: PrivilegeResponse | null;
  onSubmit: (data: CreateRoleRequest | UpdateRoleRequest) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function RoleForm({ 
  initialData, 
  privileges, 
  onSubmit, 
  isLoading = false, 
  onCancel 
}: RoleFormProps) {
  const [selectedPrivileges, setSelectedPrivileges] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role_name: "",
      role_description: "",
      privilege_names: [],
    },
  });

  const isEditing = !!initialData;
  const roleName = watch("role_name");
  const roleDescription = watch("role_description");

  // Set initial values when editing
  useEffect(() => {
    if (initialData) {
      reset({
        role_name: initialData.role_name,
        role_description: initialData.role_description,
        privilege_names: initialData.privilege_names,
      });
      setSelectedPrivileges(initialData.privilege_names);
    }
  }, [initialData, reset]);

  // Update form when selected privileges change
  useEffect(() => {
    setValue("privilege_names", selectedPrivileges);
  }, [selectedPrivileges, setValue]);

  const handleFormSubmit = (formData: RoleFormData) => {
    if (selectedPrivileges.length === 0) {
      toast.error("Please select at least one privilege");
      return;
    }

    const finalData = {
      ...formData,
      privilege_names: selectedPrivileges,
    };

    onSubmit(finalData);
  };

  const togglePrivilege = (privilegeName: string) => {
    setSelectedPrivileges(prev => 
      prev.includes(privilegeName)
        ? prev.filter(p => p !== privilegeName)
        : [...prev, privilegeName]
    );
  };

  const selectAllPrivileges = () => {
    if (!privileges) return;
    
    const allPrivilegeNames = allPrivileges.map(privilege => privilege.privilege_name);
    setSelectedPrivileges(allPrivilegeNames);
  };

  const clearAllPrivileges = () => {
    setSelectedPrivileges([]);
  };

    // Get all available privileges
  const allPrivileges = useMemo(() => {
    if (!privileges || !privileges.results) return [];
    return privileges.results;
  }, [privileges]);
  
  // Get unique modules
  const modules = useMemo(() => {
    if (!privileges || !privileges.results) return [];
    
    const uniqueModules = new Set(allPrivileges.map(privilege => privilege.module_id));
    return Array.from(uniqueModules);
  }, [allPrivileges]);
  
  // Filter privileges based on search and module
  const filteredPrivileges = useMemo(() => {
    return allPrivileges.filter(privilege => {
      const matchesSearch = privilege.privilege_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           privilege.privilege_desc.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesModule = selectedModule === "all" || privilege.module_id === selectedModule;
      return matchesSearch && matchesModule;
    });
  }, [allPrivileges, searchTerm, selectedModule]);
  
  // Group privileges by module for display
  const groupedPrivileges = useMemo(() => {
    if (!privileges || !privileges.results) return [];
    
    const grouped = allPrivileges.reduce((acc, privilege) => {
      const moduleId = privilege.module_id;
      if (!acc[moduleId]) {
        acc[moduleId] = [];
      }
      acc[moduleId].push(privilege);
      return acc;
    }, {} as Record<string, PrivilegeItem[]>);
    
    return Object.entries(grouped);
  }, [allPrivileges]);

    return (
    <div className="max-h-[80vh] overflow-y-auto">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Basic Role Information */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="role_name">Role Name *</Label>
            <Input
              id="role_name"
              {...register("role_name")}
              placeholder="Enter role name (e.g., Admin, Manager, User)"
              error={errors.role_name?.message}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="role_description">Role Description *</Label>
            <textarea
              id="role_description"
              {...register("role_description")}
              placeholder="Describe the role's purpose and responsibilities..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed min-h-[80px] resize-vertical"
              disabled={isLoading}
            />
            {errors.role_description && (
              <p className="mt-1.5 text-xs text-red-500">{errors.role_description.message}</p>
            )}
          </div>
        </div>

        {/* Privilege Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Privileges *</Label>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={selectAllPrivileges}
                disabled={isLoading}
              >
                Select All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearAllPrivileges}
                disabled={isLoading}
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="privilege-search">Search Privileges</Label>
              <Input
                id="privilege-search"
                placeholder="Search privileges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="module-filter">Filter by Module</Label>
              <select
                id="module-filter"
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <option value="all">All Modules</option>
                {modules.map((moduleId) => (
                  <option key={moduleId} value={moduleId}>
                    Module {moduleId}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Privileges Summary */}
          {selectedPrivileges.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Selected Privileges ({selectedPrivileges.length})
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearAllPrivileges}
                  disabled={isLoading}
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedPrivileges.map((privilege) => (
                  <span
                    key={privilege}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                  >
                    {privilege}
                    <button
                      onClick={() => togglePrivilege(privilege)}
                      className="text-blue-600 hover:text-blue-800"
                      disabled={isLoading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Privilege List */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-64 overflow-y-auto">
            {groupedPrivileges.length > 0 ? (
              groupedPrivileges.map(([moduleId, modulePrivileges]) => {
                const filteredModulePrivileges = modulePrivileges.filter(privilege => 
                  privilege.privilege_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                  (selectedModule === "all" || selectedModule === moduleId)
                );

                if (filteredModulePrivileges.length === 0) return null;

                return (
                  <div key={moduleId} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        Module {moduleId} ({filteredModulePrivileges.length})
                      </h4>
                    </div>
                    <div className="p-3 space-y-1">
                      {filteredModulePrivileges.map((privilege) => (
                        <label
                          key={privilege.id}
                          className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPrivileges.includes(privilege.privilege_name)}
                            onChange={() => togglePrivilege(privilege.privilege_name)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                            disabled={isLoading}
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                              {privilege.privilege_name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {privilege.privilege_desc}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {privileges ? "No privileges available" : "Loading privileges..."}
              </div>
            )}
          </div>

          {errors.privilege_names && (
            <p className="text-xs text-red-500">{errors.privilege_names.message}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isEditing ? "Updating..." : "Creating..."}
              </div>
            ) : (
              isEditing ? "Update Role" : "Create Role"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
