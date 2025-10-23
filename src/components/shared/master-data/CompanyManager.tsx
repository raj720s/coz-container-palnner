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
import { ExcelExportModule } from "ag-grid-enterprise";

ModuleRegistry.registerModules([
  AllCommunityModule,
  CsvExportModule,
  ExcelExportModule,
]);

// Custom Cell Renderers
const CompanyInfoRenderer = (params: ICellRendererParams) => {
  const company = params.data;
  return (
    <div className="flex items-center">
      <BuildingIcon className="w-8 h-8 text-gray-400 mr-3" />
      <div>
        <div className="font-medium text-gray-900 dark:text-white">
          {company.name}
        </div>
        {company.short_name && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {company.short_name}
          </div>
        )}
      </div>
    </div>
  );
};

const StatusRenderer = (params: ICellRendererParams) => {
  const isActive = params.value;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive
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
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        isThirdParty
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

  // Filters and pagination
  const [filters, setFilters] = useState<CompanyListRequest>({
    page: 1,
    page_size: 12,
    search: "",
    company_type: undefined,
    country: "",
    is_third_party: undefined,
    is_active: undefined,
    order_by: "name",
    order_type: "asc",
  });

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 12,
  });
  const [totalCount, setTotalCount] = useState(0);
  const gridRef = useRef<AgGridReact<Company>>(null);

  // Pagination state for AG Grid
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 1,
    totalPages: 0,
    totalRecords: 0,
    pageSize: 12,
  });

  // Column definitions
  const columnDefs: ColDef<Company>[] = useMemo(
    () => [
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

  // Handle pagination change
  const onPaginationChanged = useCallback((event: PaginationChangedEvent) => {
    if (event.api.paginationGetPageSize() !== pagination.pageSize) {
      setPagination(prev => ({
        ...prev,
        pageSize: event.api.paginationGetPageSize(),
      }));
      setFilters(prev => ({
        ...prev,
        page_size: event.api.paginationGetPageSize(),
        page: 1,
      }));
    } else if (event.api.paginationGetCurrentPage() !== pagination.pageIndex) {
      setPagination(prev => ({
        ...prev,
        pageIndex: event.api.paginationGetCurrentPage(),
      }));
      setFilters(prev => ({
        ...prev,
        page: event.api.paginationGetCurrentPage() + 1,
      }));
    }
  }, [pagination.pageSize, pagination.pageIndex]);

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

  // Handle page size change
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setFilters(prev => ({
      ...prev,
      page_size: newPageSize,
      page: 1,
    }));
  }, []);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage,
    }));
  }, []);

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

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      const blob = await companyService.exportCompanies(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `companies-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Companies exported successfully");
    } catch (error: any) {
      console.error("Error exporting companies:", error);
      toast.error("Failed to export companies");
    }
  }, [filters]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Company Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage companies, company types, and company relationships
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Input
              placeholder="Search companies..."
              value={filters.search || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Select
              value={filters.company_type || ""}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange("company_type", e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">All Types</option>
              {COMPANY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Select
              value={filters.country || ""}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange("country", e.target.value || undefined)}
            >
              <option value="">All Countries</option>
              {COUNTRIES.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Select
              value={filters.is_third_party === undefined ? "" : filters.is_third_party.toString()}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange("is_third_party", e.target.value === "" ? undefined : e.target.value === "true")}
            >
              <option value="">All Companies</option>
              <option value="false">Internal</option>
              <option value="true">Third Party</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleCreate}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Company</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center space-x-2"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
        <div className="text-sm text-gray-500">
          {paginationInfo.totalRecords} companies found
        </div>
      </div>

      {/* AG Grid Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div style={{ height: "calc(100vh - 340px)", minHeight: "500px" }} className="ag-theme-alpine">
          <AgGridReact
            ref={gridRef}
            rowData={data}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            loading={loading}
            pagination={true}
            paginationPageSize={pagination.pageSize}
            paginationAutoPageSize={false}
            suppressPaginationPanel={false}
            domLayout="normal"
            animateRows={true}
            onGridReady={onGridReady}
            onPaginationChanged={onPaginationChanged}
            paginationPageSizeSelector={[12, 25, 50, 100]}
            suppressRowClickSelection={false}
            rowSelection="single"
            context={{
              onEdit: handleEdit,
              onDelete: handleDelete,
            }}
          />
        </div>

        {/* Custom Pagination */}
        <div className="px-6 py-3 border-t border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">Rows per page:</span>
            <div className="relative">
              <select
                value={filters.page_size}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1.5 text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
              >
                <option value={12}>12</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-600 font-medium">
              {paginationInfo.totalRecords > 0 
                ? `${(paginationInfo.currentPage - 1) * paginationInfo.pageSize + 1}-${Math.min(paginationInfo.currentPage * paginationInfo.pageSize, paginationInfo.totalRecords)} of ${paginationInfo.totalRecords}`
                : '0 of 0'
              }
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(paginationInfo.currentPage - 1)}
                disabled={paginationInfo.currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                aria-label="Previous page"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={() => handlePageChange(paginationInfo.currentPage + 1)}
                disabled={paginationInfo.currentPage >= paginationInfo.totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                aria-label="Next page"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
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
