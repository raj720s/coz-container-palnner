"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { CreateRoleRequest, UpdateRoleRequest, PrivilegeResponse, PrivilegeItem, roleService } from "@/services/roleService";
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
  privileges: externalPrivileges, 
  onSubmit, 
  isLoading = false, 
  onCancel 
}: RoleFormProps) {
  const [selectedPrivileges, setSelectedPrivileges] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [privileges, setPrivileges] = useState<PrivilegeResponse | null>(null);
  const [privilegesLoading, setPrivilegesLoading] = useState(false);

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

  // Fetch privileges function
  const fetchPrivileges = async () => {
    try {
      setPrivilegesLoading(true);
      const response = await roleService.getPrivileges({
        page: 1,
        page_size: 1000, // Get all privileges
        order_by: 'privilege_name',
        order_type: 'asc'
      });
      console.log('🔍 RoleForm: Privileges fetched:', response);
      setPrivileges(response);
    } catch (error) {
      console.error('❌ RoleForm: Error fetching privileges:', error);
      toast.error('Failed to fetch privileges');
    } finally {
      setPrivilegesLoading(false);
    }
  };

  // Fetch privileges on component mount or when external privileges change
  useEffect(() => {
    if (externalPrivileges) {
      // Use external privileges if provided
      setPrivileges(externalPrivileges);
      setPrivilegesLoading(false);
    } else {
      // Fetch privileges ourselves
      fetchPrivileges();
    }
  }, [externalPrivileges]);

  // Set initial values when editing
  useEffect(() => {
    if (initialData) {
      reset({
        role_name: initialData.role_name,
        role_description: initialData.role_description,
        privilege_names: initialData.privilege_names,
      });
      // Only set selected privileges if we have the initial data
      if (initialData.privilege_names && initialData.privilege_names.length > 0) {
        setSelectedPrivileges(initialData.privilege_names);
        console.log('🔍 RoleForm: Setting initial privileges:', initialData.privilege_names);
      }
    }
  }, [initialData, reset]);

  // Update form when selected privileges change
  useEffect(() => {
    setValue("privilege_names", selectedPrivileges || []);
  }, [selectedPrivileges, setValue]);

  // Set selected privileges when privileges data is loaded and we have initial data
  useEffect(() => {
    if (privileges && privileges.results && initialData && initialData.privilege_names) {
      // Check if the privileges we have match the initial data
      const availablePrivilegeNames = privileges.results.map(p => p.privilege_name);
      const initialPrivileges = initialData.privilege_names;
      
      // Only set if we haven't already set them and if they're different
      if (selectedPrivileges.length === 0 || 
          JSON.stringify(selectedPrivileges.sort()) !== JSON.stringify(initialPrivileges.sort())) {
        console.log('🔍 RoleForm: Privileges loaded, setting selected privileges:', {
          available: availablePrivilegeNames.length,
          initial: initialPrivileges,
          current: selectedPrivileges
        });
        setSelectedPrivileges(initialPrivileges);
      }
    }
  }, [privileges, initialData]); // Removed selectedPrivileges from dependencies to prevent infinite loop

  const handleFormSubmit = (formData: RoleFormData) => {
    if (!selectedPrivileges || selectedPrivileges.length === 0) {
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
    console.log('🔍 RoleForm: Toggling privilege:', privilegeName);
    console.log('🔍 RoleForm: Current selected privileges:', selectedPrivileges);
    
    setSelectedPrivileges(prev => {
      if (!prev) {
        console.log('🔍 RoleForm: No previous privileges, adding:', privilegeName);
        return [privilegeName];
      }
      
      const newPrivileges = prev.includes(privilegeName)
        ? prev.filter(p => p !== privilegeName)
        : [...prev, privilegeName];
      
      console.log('🔍 RoleForm: New privileges:', newPrivileges);
      return newPrivileges;
    });
  };

  const selectAllPrivileges = () => {
    if (!privileges || !privileges.results) {
      toast.error('Privileges not loaded yet');
      return;
    }
    
    const allPrivilegeNames = allPrivileges.map(privilege => privilege.privilege_name);
    setSelectedPrivileges(allPrivilegeNames || []);
    toast.success(`Selected ${allPrivilegeNames.length} privileges`);
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
                 onClick={fetchPrivileges}
                 disabled={privilegesLoading}
               >
                 {privilegesLoading ? "Loading..." : "Refresh"}
               </Button>
               <Button
                 size="sm"
                 variant="outline"
                 onClick={selectAllPrivileges}
                 disabled={isLoading || !privileges}
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

                     {/* Debug Info */}
           <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-xs">
             <div className="font-medium mb-2">Debug Info:</div>
             <div>Selected Privileges Count: {selectedPrivileges.length}</div>
             <div>Selected Privileges: {selectedPrivileges.join(', ')}</div>
             <div>Initial Data Privileges: {initialData?.privilege_names?.join(', ') || 'None'}</div>
             <div>Privileges Loaded: {privileges ? 'Yes' : 'No'}</div>
             <div>Privileges Count: {privileges?.results?.length || 0}</div>
           </div>

           {/* Selected Privileges Summary */}
           {selectedPrivileges && selectedPrivileges.length > 0 && (
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
             {privilegesLoading ? (
               <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                 Loading privileges...
               </div>
             ) : groupedPrivileges.length > 0 ? (
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
                            data-privilege={privilege.privilege_name}
                            data-selected={selectedPrivileges.includes(privilege.privilege_name)}
                            data-selected-count={selectedPrivileges.length}
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
                 {privileges ? "No privileges available" : "No privileges loaded"}
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
              data-form-action="cancel"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button
            data-form-action="submit"
            onClick={() => handleSubmit(handleFormSubmit)()}
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
