"use client";

import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";

import { CompanyForm, type CompanyFormData } from "@/components/forms/CompanyForm";
import { FormModal } from "@/components/ui/modal/FormModal";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/select/SelectField";
import { DownloadIcon, AlertIcon, CheckCircleIcon, TimeIcon, BuildingIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { Company, CompanyListRequest, COMPANY_TYPES, COUNTRIES } from "@/types/company";

import { companyService } from "@/services/companyService";

// AG Grid imports
import type {
  ColDef,
  ICellRendererParams,
  GridReadyEvent,
  PaginationChangedEvent,
} from "ag-grid-community";
import {
  AllCommunityModule,
  ModuleRegistry,
  CsvExportModule,
} from "ag-grid-community";
import {
  AgGridReact,
} from "ag-grid-react";
import { ExcelExportModule, SetFilterModule } from "ag-grid-enterprise";

ModuleRegistry.registerModules([
  AllCommunityModule,
  CsvExportModule,
  ExcelExportModule,
  SetFilterModule,
]);

// Custom Cell Renderers
const CompanyInfoRenderer = (params: ICellRendererParams) => {
  const company = params.data;
  return (
    <div className="flex items-center">
      <div>
        <div className="font-medium text-gray-900 dark:text-white">
          {company.name}
        </div>
      </div>
    </div>
  );
};

const StatusRenderer = (params: ICellRendererParams) => {
  const isActive = params.value;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        }`}
    >
      {isActive ? (
        <>
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Active
        </>
      ) : (
        <>
          <AlertIcon className="w-3 h-3 mr-1" />
          Inactive
        </>
      )}
    </span>
  );
};

const CompanyTypeRenderer = (params: ICellRendererParams) => {
  const companyType = COMPANY_TYPES.find(type => type.value === params.value);
  return (
    <span className="text-sm text-gray-900 dark:text-white">
      {companyType?.label || params.value}
    </span>
  );
};

const ThirdPartyRenderer = (params: ICellRendererParams) => {
  const isThirdParty = params.value;
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isThirdParty
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
        }`}
    >
      {isThirdParty ? "Yes" : "No"}
    </span>
  );
};

const ActionsRenderer = (params: ICellRendererParams) => {
  const { onEdit, onDelete } = params.context;
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => onEdit(params.data)}
        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
        title="Edit company"
      >
        <PencilIcon className="w-4 h-4" />
      </button>
      <button
        onClick={() => onDelete(params.data)}
        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
        title="Delete company"
      >
        <TrashBinIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

const CompanyManager: React.FC = () => {
  const [data, setData] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Company | null>(null);
  const [deleteItem, setDeleteItem] = useState<Company | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exportSelectedOnly, setExportSelectedOnly] = useState(false);

  // Filters and pagination
  const [filters, setFilters] = useState<CompanyListRequest>({
    page: 1,
    page_size: 10,
    search: "",
    company_type: undefined,
    country: "",
    is_third_party: undefined,
    is_active: undefined,
    order_by: "name",
    order_type: "asc",
  });

  const [totalCount, setTotalCount] = useState(0);
  const gridRef = useRef<AgGridReact<Company>>(null);

  // Pagination state
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 1,
    totalPages: 0,
    totalRecords: 0,
    pageSize: 10,
  });

  // Column definitions
  const columnDefs: ColDef<Company>[] = useMemo(
    () => [
      {
        colId: "checkbox",
        headerName: "",
        checkboxSelection: true,
        headerCheckboxSelection: true,
        pinned: "left",
        sortable: false,
        filter: false,
        minWidth: 50,
        flex: 0,
      },
      {
        field: "name",
        headerName: "Company",
        cellRenderer: CompanyInfoRenderer,
        flex: 2,
        minWidth: 200,
        sortable: true,
        filter: "agTextColumnFilter",
        filterParams: {
          filterOptions: ["contains", "startsWith", "endsWith"],
          defaultOption: "contains",
        },
      },
      {
        field: "company_type",
        headerName: "Type",
        cellRenderer: CompanyTypeRenderer,
        flex: 1,
        minWidth: 120,
        sortable: true,
        filter: "agSetColumnFilter",
        filterParams: {
          values: COMPANY_TYPES.map(type => type.value),
          valueFormatter: (params: any) => {
            const companyType = COMPANY_TYPES.find(type => type.value === params.value);
            return companyType?.label || params.value;
          },
        },
      },
      {
        field: "email",
        headerName: "Email",
        flex: 1.5,
        minWidth: 180,
        sortable: true,
        filter: "agTextColumnFilter",
        filterParams: {
          filterOptions: ["contains", "startsWith", "endsWith"],
          defaultOption: "contains",
        },
      },
      {
        field: "phone",
        headerName: "Phone",
        flex: 1,
        minWidth: 120,
        sortable: true,
        filter: "agTextColumnFilter",
      },
      {
        field: "country",
        headerName: "Country",
        flex: 1,
        minWidth: 120,
        sortable: true,
        filter: "agSetColumnFilter",
        filterParams: {
          values: COUNTRIES.map(country => country.value),
          valueFormatter: (params: any) => {
            const country = COUNTRIES.find(c => c.value === params.value);
            return country?.label || params.value;
          },
        },
      },
      {
        field: "is_third_party",
        headerName: "Third Party",
        cellRenderer: ThirdPartyRenderer,
        flex: 1,
        minWidth: 100,
        sortable: true,
        filter: "agSetColumnFilter",
        filterParams: {
          values: [true, false],
          valueFormatter: (params: any) => (params.value ? "Yes" : "No"),
        },
      },
      {
        field: "is_active",
        headerName: "Status",
        cellRenderer: StatusRenderer,
        flex: 1,
        minWidth: 100,
        sortable: true,
        filter: "agSetColumnFilter",
        filterParams: {
          values: [true, false],
          valueFormatter: (params: any) => (params.value ? "Active" : "Inactive"),
        },
      },
      {
        headerName: "Actions",
        cellRenderer: ActionsRenderer,
        flex: 0.8,
        minWidth: 100,
        sortable: false,
        filter: false,
        pinned: "right",
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    []
  );

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await companyService.getCompanies(filters);
      setData(response.results);
      setTotalCount(response.count);
      setPaginationInfo({
        currentPage: filters.page || 1,
        totalPages: Math.ceil(response.count / (filters.page_size || 12)),
        totalRecords: response.count,
        pageSize: filters.page_size || 12,
      });
    } catch (error: any) {
      console.error("Error fetching companies:", error);
      toast.error("Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load data on mount and when filters change
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Handle grid ready
  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  }, []);

  // Handle search
  const handleSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
      page: 1,
    }));
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof CompanyListRequest, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  }, []);

  // Handle pagination changes
  const onPaginationChanged = useCallback(() => {
    if (gridRef.current) {
      const api = gridRef.current.api;
      const currentPage = api.paginationGetCurrentPage();
      const pageSize = api.paginationGetPageSize();
      
      // Update filters with new page (convert from 0-based to 1-based)
      const newPage = currentPage + 1;
      
      if (newPage !== filters.page || pageSize !== filters.page_size) {
        setFilters(prev => ({
          ...prev,
          page: newPage,
          page_size: pageSize,
        }));
      }
    }
  }, [filters.page, filters.page_size]);

  // Handle create
  const handleCreate = useCallback(() => {
    setEditingItem(null);
    setIsModalOpen(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback((company: Company) => {
    setEditingItem(company);
    setIsModalOpen(true);
  }, []);

  // Handle delete
  const handleDelete = useCallback((company: Company) => {
    setDeleteItem(company);
  }, []);

  // Handle confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteItem) return;

    setIsSubmitting(true);
    try {
      await companyService.deleteCompany(deleteItem.id);
      toast.success("Company deleted successfully");
      setDeleteItem(null);
      fetchCompanies();
    } catch (error: any) {
      console.error("Error deleting company:", error);
      toast.error("Failed to delete company");
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteItem, fetchCompanies]);

  // Handle modal close
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
    setIsSubmitting(false);
  }, []);

  // Handle export to Excel
  const handleExportExcel = useCallback(() => {
    if (gridRef.current) {
      try {
        gridRef.current.api.exportDataAsExcel({
          fileName: `companies_${new Date().toISOString().split('T')[0]}.xlsx`,
          sheetName: "Companies",
          onlySelected: exportSelectedOnly,
        });
        toast.success("Companies exported to Excel successfully");
      } catch (error: any) {
        console.error("Error exporting to Excel:", error);
        toast.error("Failed to export to Excel");
      }
    }
  }, [exportSelectedOnly]);

  // Handle export to CSV
  const handleExportCSV = useCallback(() => {
    if (gridRef.current) {
      try {
        gridRef.current.api.exportDataAsCsv({
          fileName: `companies_${new Date().toISOString().split('T')[0]}.csv`,
          onlySelected: exportSelectedOnly,
        });
        toast.success("Companies exported to CSV successfully");
      } catch (error: any) {
        console.error("Error exporting to CSV:", error);
        toast.error("Failed to export to CSV");
      }
    }
  }, [exportSelectedOnly]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Company Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage companies, company types, and company relationships
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Companies</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalCount}
              </p>
            </div>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">🏢</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {data.filter(c => c.is_active).length}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-sm font-bold">✓</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Third Party</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {data.filter(c => c.is_third_party).length}
              </p>
            </div>
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 text-sm font-bold">🤝</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Countries</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {new Set(data.map(c => c.country).filter(Boolean)).size}
              </p>
            </div>
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <span className="text-orange-600 dark:text-orange-400 text-sm font-bold">🌍</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <Input
                placeholder="Search companies..."
                value={filters.search || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                className="w-full focus:ring-theme-purple-500 focus:border-theme-purple-500"
              />
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-3">
              <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={exportSelectedOnly}
                  onChange={(e) => setExportSelectedOnly(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span>Selected Rows Only</span>
              </label>
              <Button 
                type="button"
                onClick={handleExportExcel} 
                size="sm" 
                variant="outline"
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Button 
                type="button"
                onClick={handleExportCSV} 
                size="sm" 
                variant="outline"
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Add Button */}
            <Button 
              type="button"
              onClick={handleCreate} 
              size="sm"
              className="bg-theme-purple-600 hover:bg-theme-purple-700 text-white px-4 py-2 whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          </div>
        </div>
      </div>


      {/* AG Grid Table */}
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
        style={{ height: "600px" }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={data}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          loading={loading}
          pagination={true}
          paginationPageSize={filters.page_size}
          paginationAutoPageSize={false}
          suppressPaginationPanel={false}
          domLayout="normal"
          animateRows={true}
          className="ag-theme-alpine"
          onGridReady={onGridReady}
          onPaginationChanged={onPaginationChanged}
          paginationPageSizeSelector={[10, 25, 50, 100]}
          suppressRowClickSelection={false}
          rowSelection="multiple"
          context={{
            onEdit: handleEdit,
            onDelete: handleDelete,
          }}
        />
      </div>

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Company" : "Add New Company"}
        size="lg"
        showHeader={true}
        showFooter={true}
      >
        <CompanyForm
          initialData={editingItem || undefined}
          onSuccess={() => {
            closeModal();
            fetchCompanies();
          }}
          onCancel={closeModal}
          isEditing={!!editingItem}
        />
      </FormModal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Company"
        message={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default withSimplifiedRBAC(CompanyManager, { module: [65] });