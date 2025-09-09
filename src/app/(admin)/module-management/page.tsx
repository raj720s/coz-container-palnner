"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { staticModuleDefinitions } from '@/config/staticModules';
import { simplifiedRBACService, ModuleCustomization } from '@/services/simplifiedRBACService';
import { useSimplifiedAuth } from '@/hooks/useSimplifiedRBAC';
import { withSimplifiedRBAC } from '@/components/auth/withSimplifiedRBAC';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import toast from 'react-hot-toast';

interface ModuleManagementProps {}

function ModuleManagement({}: ModuleManagementProps) {
  const { can, canVisit, canAccessModule, isAdmin } = useSimplifiedAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [modules, setModules] = useState<ModuleCustomization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleCustomization | null>(null);

  // Load modules on component mount
  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setLoading(true);
      const allModules = await simplifiedRBACService.getAllModules();
      setModules(allModules);
    } catch (error) {
      console.error('Error loading modules:', error);
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  // Get all privileges
  const allPrivileges = useMemo(() => {
    return simplifiedRBACService.getAllPrivileges();
  }, []);

  // Get all routes
  const allRoutes = useMemo(() => {
    return simplifiedRBACService.getAllRoutes();
  }, []);

  // Filter modules based on search
  const filteredModules = useMemo(() => {
    if (!searchTerm) return modules;
    
    return modules.filter(module => 
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.privileges.some(p => p.toLowerCase().includes(searchTerm.toLowerCase())) ||
      module.routes.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [modules, searchTerm]);

  const toggleModuleExpansion = (moduleId: number) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  // CRUD Operations
  const handleCreateModule = async (moduleData: Omit<ModuleCustomization, 'id' | 'created_at' | 'updated_at' | 'is_custom'>) => {
    try {
      const newModule = await simplifiedRBACService.createModule(moduleData);
      setModules(prev => [...prev, newModule]);
      setShowCreateForm(false);
      toast.success('Module created successfully');
    } catch (error) {
      console.error('Error creating module:', error);
      toast.error('Failed to create module');
    }
  };

  const handleUpdateModule = async (moduleId: number, moduleData: Partial<ModuleCustomization>) => {
    try {
      const updatedModule = await simplifiedRBACService.updateModule(moduleId, moduleData);
      setModules(prev => prev.map(m => m.id === moduleId ? updatedModule : m));
      setEditingModule(null);
      toast.success('Module updated successfully');
    } catch (error) {
      console.error('Error updating module:', error);
      toast.error('Failed to update module');
    }
  };

  const handleDeleteModule = async (moduleId: number) => {
    if (!window.confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
      return;
    }

    try {
      await simplifiedRBACService.deleteModule(moduleId);
      setModules(prev => prev.filter(m => m.id !== moduleId));
      toast.success('Module deleted successfully');
    } catch (error) {
      console.error('Error deleting module:', error);
      toast.error('Failed to delete module');
    }
  };

  const handleRefresh = () => {
    loadModules();
  };

  const getModuleStats = () => {
    const totalModules = modules.length;
    const customModules = modules.filter(m => m.is_custom).length;
    const staticModules = modules.filter(m => !m.is_custom).length;
    const totalPrivileges = allPrivileges.length;
    const totalRoutes = allRoutes.length;
    
    return { totalModules, customModules, staticModules, totalPrivileges, totalRoutes };
  };

  const stats = getModuleStats();

  if (!can("VIEW SYSTEM SETTINGS") && !canAccessModule(70) && !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-yellow-600 dark:text-yellow-400 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access module management. You need either the "VIEW SYSTEM SETTINGS" privilege or access to Module 70 (System Administration).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Module Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage static modules, routes, and privileges for the RBAC system
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2"
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
          {can("CREATE ROLE") && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2"
            >
              Create Module
            </Button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Modules</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalModules}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
              <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Static Modules</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.staticModules}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Custom Modules</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.customModules}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Privileges</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPrivileges}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Routes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRoutes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <Label htmlFor="search" className="text-sm font-medium mb-2 block">Search Modules</Label>
        <Input
          id="search"
          placeholder="Search by module name, description, privileges, or routes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {filteredModules.map((module) => (
          <div
            key={module.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            {/* Module Header */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={() => toggleModuleExpansion(module.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-${module.color}-100 dark:bg-${module.color}-900/20`}>
                    <svg className={`h-5 w-5 text-${module.color}-600 dark:text-${module.color}-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {module.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {module.description}
                    </p>
                  </div>
                </div>
                                 <div className="flex items-center space-x-4">
                   <div className="text-right">
                     <div className="text-sm text-gray-600 dark:text-gray-400">
                       {module.privileges.length} privileges
                     </div>
                     <div className="text-sm text-gray-600 dark:text-gray-400">
                       {module.routes.length} routes
                     </div>
                     {module.is_custom && (
                       <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                         Custom
                       </div>
                     )}
                   </div>
                   <div className="flex items-center space-x-2">
                     {module.is_custom && can("EDIT ROLE") && (
                       <div className="flex space-x-1">
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={(e) => {
                             e.stopPropagation();
                             setEditingModule(module);
                           }}
                           className="text-xs px-2 py-1"
                         >
                           Edit
                         </Button>
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={(e) => {
                             e.stopPropagation();
                             handleDeleteModule(module.id);
                           }}
                           className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                         >
                           Delete
                         </Button>
                       </div>
                     )}
                     <svg
                       className={`h-5 w-5 text-gray-400 transition-transform ${
                         expandedModules.has(module.id) ? 'rotate-180' : ''
                       }`}
                       fill="none"
                       viewBox="0 0 24 24"
                       stroke="currentColor"
                     >
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                     </svg>
                   </div>
                 </div>
              </div>
            </div>

            {/* Module Details */}
            {expandedModules.has(module.id) && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                {/* Privileges */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Privileges ({module.privileges.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {module.privileges.map((privilege, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                      >
                        {privilege}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Routes */}
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Routes ({module.routes.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {module.routes.map((route, index) => (
                      <div
                        key={index}
                        className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg text-sm text-blue-700 dark:text-blue-300 font-mono"
                      >
                        {route}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

             {/* Empty State */}
       {filteredModules.length === 0 && (
         <div className="text-center py-12">
           <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
           </svg>
           <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No modules found</h3>
           <p className="text-gray-600 dark:text-gray-400">
             Try adjusting your search terms to find modules.
           </p>
         </div>
       )}

       {/* Create Module Form */}
       {showCreateForm && (
         <CreateModuleForm
           onSubmit={handleCreateModule}
           onCancel={() => setShowCreateForm(false)}
         />
       )}

       {/* Edit Module Form */}
       {editingModule && (
         <EditModuleForm
           module={editingModule}
           onSubmit={(data) => handleUpdateModule(editingModule.id, data)}
           onCancel={() => setEditingModule(null)}
         />
       )}
     </div>
   );
 }

 // Create Module Form Component
 function CreateModuleForm({ 
   onSubmit, 
   onCancel 
 }: { 
   onSubmit: (data: Omit<ModuleCustomization, 'id' | 'created_at' | 'updated_at' | 'is_custom'>) => void;
   onCancel: () => void;
 }) {
     const [formData, setFormData] = useState({
    name: '',
    description: '',
    routes: [''],
    privileges: ['']
  });

   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     
         const cleanData = {
      name: formData.name,
      description: formData.description,
      routes: formData.routes.filter(route => route.trim() !== ''),
      privileges: formData.privileges.filter(privilege => privilege.trim() !== ''),
      created_by: 'current_user' // This would come from auth context
    };

     onSubmit(cleanData);
   };

   const addRoute = () => {
     setFormData(prev => ({ ...prev, routes: [...prev.routes, ''] }));
   };

   const removeRoute = (index: number) => {
     setFormData(prev => ({ 
       ...prev, 
       routes: prev.routes.filter((_, i) => i !== index) 
     }));
   };

   const updateRoute = (index: number, value: string) => {
     setFormData(prev => ({
       ...prev,
       routes: prev.routes.map((route, i) => i === index ? value : route)
     }));
   };

   const addPrivilege = () => {
     setFormData(prev => ({ ...prev, privileges: [...prev.privileges, ''] }));
   };

   const removePrivilege = (index: number) => {
     setFormData(prev => ({ 
       ...prev, 
       privileges: prev.privileges.filter((_, i) => i !== index) 
     }));
   };

   const updatePrivilege = (index: number, value: string) => {
     setFormData(prev => ({
       ...prev,
       privileges: prev.privileges.map((privilege, i) => i === index ? value : privilege)
     }));
   };

   return (
     <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
       <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Module</h3>
       
       <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
          <Label htmlFor="name">Module Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter module name"
            required
          />
        </div>

         <div>
           <Label htmlFor="description">Description *</Label>
           <textarea
             id="description"
             value={formData.description}
             onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
             placeholder="Enter module description"
             className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
             rows={3}
             required
           />
         </div>

         <div>
           <Label>Routes</Label>
           <div className="space-y-2">
             {formData.routes.map((route, index) => (
               <div key={index} className="flex space-x-2">
                 <Input
                   value={route}
                   onChange={(e) => updateRoute(index, e.target.value)}
                   placeholder="/admin/example"
                   className="flex-1"
                 />
                 {formData.routes.length > 1 && (
                   <Button
                     type="button"
                     variant="outline"
                     onClick={() => removeRoute(index)}
                     className="px-3 py-2 text-red-600"
                   >
                     Remove
                   </Button>
                 )}
               </div>
             ))}
             <Button type="button" variant="outline" onClick={addRoute} className="text-sm">
               Add Route
             </Button>
           </div>
         </div>

         <div>
           <Label>Privileges</Label>
           <div className="space-y-2">
             {formData.privileges.map((privilege, index) => (
               <div key={index} className="flex space-x-2">
                 <Input
                   value={privilege}
                   onChange={(e) => updatePrivilege(index, e.target.value)}
                   placeholder="VIEW EXAMPLE"
                   className="flex-1"
                 />
                 {formData.privileges.length > 1 && (
                   <Button
                     type="button"
                     variant="outline"
                     onClick={() => removePrivilege(index)}
                     className="px-3 py-2 text-red-600"
                   >
                     Remove
                   </Button>
                 )}
               </div>
             ))}
             <Button type="button" variant="outline" onClick={addPrivilege} className="text-sm">
               Add Privilege
             </Button>
           </div>
         </div>

         <div className="flex justify-end space-x-3 pt-4">
           <Button type="button" variant="outline" onClick={onCancel}>
             Cancel
           </Button>
           <Button type="submit">
             Create Module
           </Button>
         </div>
       </form>
     </div>
   );
 }

 // Edit Module Form Component
 function EditModuleForm({ 
   module, 
   onSubmit, 
   onCancel 
 }: { 
   module: ModuleCustomization;
   onSubmit: (data: Partial<ModuleCustomization>) => void;
   onCancel: () => void;
 }) {
     const [formData, setFormData] = useState({
    name: module.name,
    description: module.description,
    routes: module.routes.length > 0 ? module.routes : [''],
    privileges: module.privileges.length > 0 ? module.privileges : ['']
  });

   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     
         const cleanData = {
      name: formData.name,
      description: formData.description,
      routes: formData.routes.filter(route => route.trim() !== ''),
      privileges: formData.privileges.filter(privilege => privilege.trim() !== '')
    };

     onSubmit(cleanData);
   };

   const addRoute = () => {
     setFormData(prev => ({ ...prev, routes: [...prev.routes, ''] }));
   };

   const removeRoute = (index: number) => {
     setFormData(prev => ({ 
       ...prev, 
       routes: prev.routes.filter((_, i) => i !== index) 
     }));
   };

   const updateRoute = (index: number, value: string) => {
     setFormData(prev => ({
       ...prev,
       routes: prev.routes.map((route, i) => i === index ? value : route)
     }));
   };

   const addPrivilege = () => {
     setFormData(prev => ({ ...prev, privileges: [...prev.privileges, ''] }));
   };

   const removePrivilege = (index: number) => {
     setFormData(prev => ({ 
       ...prev, 
       privileges: prev.privileges.filter((_, i) => i !== index) 
     }));
   };

   const updatePrivilege = (index: number, value: string) => {
     setFormData(prev => ({
       ...prev,
       privileges: prev.privileges.map((privilege, i) => i === index ? value : privilege)
     }));
   };

   return (
     <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
       <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Module: {module.name}</h3>
       
       <form onSubmit={handleSubmit} className="space-y-4">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <Label htmlFor="edit-name">Module Name *</Label>
             <Input
               id="edit-name"
               value={formData.name}
               onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
               placeholder="Enter module name"
               required
             />
           </div>
           
           <div>
             <Label htmlFor="edit-color">Color</Label>
             <select
               id="edit-color"
               value={formData.color}
               onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
               className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
             >
               <option value="blue">Blue</option>
               <option value="green">Green</option>
               <option value="red">Red</option>
               <option value="yellow">Yellow</option>
               <option value="purple">Purple</option>
               <option value="pink">Pink</option>
               <option value="indigo">Indigo</option>
               <option value="gray">Gray</option>
             </select>
           </div>
         </div>

         <div>
           <Label htmlFor="edit-description">Description *</Label>
           <textarea
             id="edit-description"
             value={formData.description}
             onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
             placeholder="Enter module description"
             className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
             rows={3}
             required
           />
         </div>

         <div>
           <Label>Routes</Label>
           <div className="space-y-2">
             {formData.routes.map((route, index) => (
               <div key={index} className="flex space-x-2">
                 <Input
                   value={route}
                   onChange={(e) => updateRoute(index, e.target.value)}
                   placeholder="/admin/example"
                   className="flex-1"
                 />
                 {formData.routes.length > 1 && (
                   <Button
                     type="button"
                     variant="outline"
                     onClick={() => removeRoute(index)}
                     className="px-3 py-2 text-red-600"
                   >
                     Remove
                   </Button>
                 )}
               </div>
             ))}
             <Button type="button" variant="outline" onClick={addRoute} className="text-sm">
               Add Route
             </Button>
           </div>
         </div>

         <div>
           <Label>Privileges</Label>
           <div className="space-y-2">
             {formData.privileges.map((privilege, index) => (
               <div key={index} className="flex space-x-2">
                 <Input
                   value={privilege}
                   onChange={(e) => updatePrivilege(index, e.target.value)}
                   placeholder="VIEW EXAMPLE"
                   className="flex-1"
                 />
                 {formData.privileges.length > 1 && (
                   <Button
                     type="button"
                     variant="outline"
                     onClick={() => removePrivilege(index)}
                     className="px-3 py-2 text-red-600"
                   >
                     Remove
                   </Button>
                 )}
               </div>
             ))}
             <Button type="button" variant="outline" onClick={addPrivilege} className="text-sm">
               Add Privilege
             </Button>
           </div>
         </div>

         <div className="flex justify-end space-x-3 pt-4">
           <Button type="button" variant="outline" onClick={onCancel}>
             Cancel
           </Button>
           <Button type="submit">
             Update Module
           </Button>
         </div>
       </form>
     </div>
   );
 }

// Export with RBAC protection
export default withSimplifiedRBAC(ModuleManagement, {
  privilege: "VIEW SYSTEM SETTINGS",
  module: [70], // System Administration module
  redirectTo: "/admin/dashboard"
});
