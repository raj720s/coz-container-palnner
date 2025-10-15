"use client";

import Button from "@/components/ui/button/Button";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/components/form/input/InputField";
import { DownloadIcon, PencilIcon, TrashBinIcon, PlusIcon } from "@/icons";
import { FormModal } from "@/components/ui/modal/FormModal";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import { useFormModal } from "@/hooks/useFormModal";
import { PortForm, type PortFormData } from "@/components/forms/PortForm";
import toast from "react-hot-toast";
import { POLResponse, POLListRequest, CreatePOLRequest, UpdatePOLRequest } from "@/types/api";
import { polService } from "@/services";
import { withSimplifiedRBAC, SimplifiedRBACProps } from "@/components/auth/withSimplifiedRBAC";

// AG Grid imports
import type {
  ColDef,
  GridReadyEvent,
  CellClickedEvent,
  ValueFormatterParams,
  ICellRendererParams,
} from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

ModuleRegistry.registerModules([AllCommunityModule]);

// Custom Cell Renderers
const StatusRenderer = (params: ICellRendererParams) => {
  const isActive = params.value;
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${
        isActive
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
};

const CityRenderer = (params: ICellRendererParams) => {
  return (
    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
      {params.value}
    </span>
  );
};

const TimezoneRenderer = (params: ICellRendererParams) => {
  return (
    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
      {params.value}
    </span>
  );
};

const CodeRenderer = (params: ICellRendererParams) => {
  return (
    <span className="font-mono text-sm font-semibold">
      {params.value}
    </span>
  );
};

const NameRenderer = (params: ICellRendererParams) => {
  return (
    <span className="font-medium">
      {params.value}
    </span>
  );
};

interface PolDataManagerProps {
  rbacContext?: SimplifiedRBACProps['rbacContext'];
}

function PolDataManager({ rbacContext }: PolDataManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  
  const { can, isAdmin, isSuperUser } = rbacContext || {};
  
  const [pols, setPols] = useState<POLResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  
  const [filters, setFilters] = useState<POLListRequest>({
    page: 1,
    page_size: 10,
    order_by: "created_on",
    order_type: "desc"
  });
  
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<POLResponse | null>(null);

  const {
    isOpen: isModalOpen,
    isLoading: isModalLoading,
    editingItem,
    openModal,
    closeModal,
    setLoading: setModalLoading,
  } = useFormModal<POLResponse>();

  const canDeletePOL = can?.("DELETE_POL") || isAdmin?.() || isSuperUser;

  // Auto-open modal if action=add
  useEffect(() => {
    if (action === 'add') {
      openModal(undefined);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('action');
      router.replace(`?${newSearchParams.toString()}`);
    }
  }, [action, openModal, router, searchParams]);

  // Load POL ports
  useEffect(() => {
    loadPOLs();
  }, [filters]);

  // Auto-clear errors
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadPOLs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await polService.getPOLs(filters);
      setPols(response.results || []);
      setTotal(response.count || 0);
    } catch (err: any) {
      console.error('Error loading POL ports:', err);
      setError(err.message || 'Failed to load POL ports');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (pol: POLResponse) => {
    if (!canDeletePOL) {
      toast.error("You don't have permission to delete POL data");
      return;
    }
    
    setDeletingItem(pol);
    setDeleteModalOpen(true);
  };

  // Actions Cell Renderer
  const ActionsRenderer = useCallback((params: ICellRendererParams) => {
    return (
      <div className="flex space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => openModal(params.data)}
          className="p-1"
        >
          <PencilIcon className="w-4 h-4" />
        </Button>
        
        {canDeletePOL && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteClick(params.data)}
            className="p-1 text-red-600 hover:text-red-700"
          >
            <TrashBinIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }, [canDeletePOL, openModal]);

  // Column Definitions
  const columnDefs = useMemo<ColDef[]>(() => [
    {
      field: "code",
      headerName: "Port Code",
      width: 150,
      sortable: true,
      filter: true,
      cellRenderer: CodeRenderer,
    },
    {
      field: "name",
      headerName: "Port Name",
      width: 200,
      sortable: true,
      filter: true,
      cellRenderer: NameRenderer,
    },
    {
      field: "country",
      headerName: "Country",
      width: 150,
      sortable: true,
      filter: true,
    },
    {
      field: "city",
      headerName: "City",
      width: 150,
      sortable: true,
      filter: true,
      cellRenderer: CityRenderer,
    },
    {
      field: "timezone",
      headerName: "Timezone",
      width: 150,
      sortable: true,
      filter: true,
      cellRenderer: TimezoneRenderer,
    },
    {
      field: "is_active",
      headerName: "Status",
      width: 120,
      sortable: true,
      filter: true,
      cellRenderer: StatusRenderer,
    },
    {
      headerName: "Actions",
      width: 150,
      cellRenderer: ActionsRenderer,
      sortable: false,
      filter: false,
      pinned: "right",
    },
  ], [ActionsRenderer]);

  // Default Column Definition
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), []);

  const handleSubmit = async (formData: PortFormData) => {
    try {
      setModalLoading(true);
      
      const polData: CreatePOLRequest | UpdatePOLRequest = {
        name: formData.name,
        code: formData.code,
        country: formData.country,
        city: formData.city,
        timezone: formData.timezone,
        is_active: formData.is_active,
      };
      
      if (editingItem) {
        await polService.updatePOL(editingItem.id, polData);
        toast.success('POL port updated successfully');
      } else {
        await polService.createPOL(polData as CreatePOLRequest);
        toast.success('POL port created successfully');
      }
      
      loadPOLs();
      closeModal();
    } catch (error: any) {
      console.error('Error saving POL port:', error);
      toast.error(error.message || 'Failed to save POL port');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    if (!canDeletePOL) {
      toast.error("You don't have permission to delete POL data");
      setDeleteModalOpen(false);
      setDeletingItem(null);
      return;
    }

    try {
      setModalLoading(true);
      await polService.deletePOL(deletingItem.id);
      toast.success('POL port deleted successfully');
      setDeleteModalOpen(false);
      setDeletingItem(null);
      loadPOLs();
    } catch (error: any) {
      console.error('Error deleting POL port:', error);
      toast.error(error.message || 'Failed to delete POL port');
    } finally {
      setModalLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const exportData = await polService.exportPOLs({
        ...filters,
        export: true,
        page_size: 1000
      });
      
      const headers = ['Code', 'Name', 'Country', 'City', 'Timezone', 'Status', 'Created On'];
      const csvRows = [
        headers.join(','),
        ...exportData.map(pol => [
          pol.code,
          pol.name,
          pol.country,
          pol.city,
          pol.timezone,
          pol.is_active ? 'Active' : 'Inactive',
          pol.created_on ? new Date(pol.created_on).toLocaleDateString() : 'N/A'
        ].join(','))
      ];
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pol_ports_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('POL ports exported successfully');
    } catch (error: any) {
      console.error('Error exporting POL ports:', error);
      toast.error('Failed to export POL ports');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm: string) => {
    setGlobalFilter(searchTerm);
    setFilters(prev => ({ 
      ...prev,
      name: searchTerm,
      page: 1 
    }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">         
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          POL Master
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage Port of Loading (POL) ports and their configurations
        </p>
        
        {!canDeletePOL && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">
                <strong>Read-only mode:</strong> You can view and edit POL data, but cannot delete records.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total POL Ports</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{total}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Active Ports</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {pols.filter(p => p.is_active).length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Countries</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {new Set(pols.map(p => p.country)).size}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Cities</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {new Set(pols.map(p => p.city)).size}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search ports by Port Name"
                value={globalFilter}
                onChange={(e) => handleSearch(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" onClick={handleExport} size="sm" variant="outline" disabled={loading}>
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button type="button" onClick={() => openModal()} size="sm">
                <PlusIcon className="w-4 h-4 mr-2" />
                Add POL Port
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* AG Grid Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden" style={{ height: '600px' }}>
        <AgGridReact
          rowData={pols}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          loading={loading}
          pagination={true}
          paginationPageSize={filters.page_size}
          domLayout="normal"
          animateRows={true}
          className="ag-theme-alpine"
        />
      </div>

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit POL Port" : "Add New POL Port"}
      >
        <PortForm
          initialData={editingItem ? {
            id: editingItem.id.toString(),
            code: editingItem.code,
            name: editingItem.name,
            country: editingItem.country,
            city: editingItem.city,
            timezone: editingItem.timezone,
            type: "POL" as const,
            is_active: editingItem.is_active
          } : undefined}
          onSubmit={handleSubmit}
          portType="POL"
          isLoading={isModalLoading}
        />
      </FormModal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingItem(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete POL Port"
        message={`Are you sure you want to delete the POL port "${deletingItem?.name}" (${deletingItem?.code})? This action cannot be undone.`}
        itemName={deletingItem?.name}
        isLoading={isModalLoading}
        variant="danger"
      />
    </div>
  );
}

export default withSimplifiedRBAC(PolDataManager, {
  privilege: "VIEW_POL_PORTS",
  module: [60],
  allowSuperUserBypass: true,
  redirectTo: "/dashboard"
});

// DEBUG: This component should have role [1, 2, 3]
console.log('🔐 PolDataManager loaded with role config:', [1, 2, 3]);