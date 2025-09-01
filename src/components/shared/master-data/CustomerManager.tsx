"use client";

import Button from "@/components/ui/button/Button";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
} from "@tanstack/react-table";
import Input from "@/components/form/input/InputField";
import { DownloadIcon, PencilIcon, TrashBinIcon, PlusIcon, ChevronLeftIcon, ChevronUpIcon, ChevronDownIcon } from "@/icons";
import { FormModal } from "@/components/ui/modal/FormModal";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import { useFormModal } from "@/hooks/useFormModal";
import toast from "react-hot-toast";

import Pagination from "@/components/tables/Pagination";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  patchCustomer,
  deleteCustomer,
  exportCustomers,
  selectCustomers,
  selectCustomersLoading,
  selectCustomersError,
  selectCustomersTotal,
  clearError,
} from "@/store/slices/customerSlice";
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  usePatchCustomerMutation,
  useDeleteCustomerMutation,
} from "@/store/api/apiSlice";
import { CustomerResponse, CustomerListRequest, CreateCustomerRequest, UpdateCustomerRequest } from "@/types/api";
import { CustomerForm, CustomerFormData } from "@/components/forms/CustomerForm";
import withSimpleRBAC, { RBACContextValue } from "@/components/auth/withSimpleRBAC";

const columnHelper = createColumnHelper<CustomerResponse>();

interface CustomerManagerProps {
  rbacContext?: RBACContextValue;
}

function CustomerManager({ rbacContext }: CustomerManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  const dispatch = useDispatch<AppDispatch>();
  
  // Use RBAC context from withSimpleRBAC instead of duplicate hooks
  const { hasPrivilege, isAdmin, isSuperUser } = rbacContext || {};
  
  // Local state for filtering and pagination
  const [filters, setFilters] = useState<CustomerListRequest>({
    page: 1,
    page_size: 10,
    order_by: "created_on",
    order_type: "desc"
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<CustomerResponse | null>(null);

  // Check if user can delete customer data using RBAC context
  const canDeleteCustomer = hasPrivilege?.("DELETE_CUSTOMER") || isAdmin?.() || isSuperUser;

  // Redux state
  const customers = useSelector(selectCustomers);
  const loading = useSelector(selectCustomersLoading);
  const error = useSelector(selectCustomersError);
  const total = useSelector(selectCustomersTotal);

  // RTK Query hooks (alternative approach)
  // const { data: customersRTK, isLoading: loadingRTK, error: errorRTK } = useGetCustomersQuery(filters);
  const [createCustomerMutation] = useCreateCustomerMutation();
  const [updateCustomerMutation] = useUpdateCustomerMutation();
  const [patchCustomerMutation] = usePatchCustomerMutation();
  const [deleteCustomerMutation] = useDeleteCustomerMutation();

  // Load customers on component mount and when filters change
  useEffect(() => {
    dispatch(fetchCustomers(filters));
  }, [dispatch, filters]);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const {
    isOpen: isModalOpen,
    isLoading: isModalLoading,
    editingItem,
    openModal,
    closeModal,
    setLoading: setModalLoading,
  } = useFormModal<CustomerResponse>();

  // Auto-open modal if action=add
  useEffect(() => {
    if (action === 'add') {
      openModal(undefined);
      // Clear the URL parameter
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('action');
      router.replace(`?${newSearchParams.toString()}`);
    }
  }, [action, openModal, router, searchParams]);

  const columns = useMemo(() => [
    columnHelper.accessor("customer_code", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Customer Code
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronUpIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          )}
        </button>
      ),
      cell: (info) => <span className="font-mono text-sm font-semibold">{info.getValue()}</span>
    }),
    columnHelper.accessor("name", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Company Name
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronUpIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          )}
        </button>
      ),
      cell: (info) => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor("contact_person", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Contact Person
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronUpIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          )}
        </button>
      ),
      cell: (info) => info.getValue() 
    }),
    columnHelper.accessor("email", { 
      header: "Email",
      cell: (info) => (
        <span className="text-sm text-blue-600 dark:text-blue-400">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("phone", { 
      header: "Phone",
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {info.getValue()}
          </span>
      )
    }),
    columnHelper.accessor("country", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Country
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronUpIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          )}
        </button>
      ),
      cell: (info) => (
        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("tax_id", { 
      header: "Tax ID",
      cell: (info) => (
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("is_active", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Status
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronUpIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          )}
        </button>
      ),
      cell: (info) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          info.getValue()
            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
        }`}>
          {info.getValue() ? "Active" : "Inactive"}
        </span>
      ),
    }),
    columnHelper.accessor("created_on", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Created
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronUpIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          )}
        </button>
      ),
      cell: (info) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {info.getValue() ? new Date(info.getValue()!).toLocaleDateString() : "N/A"}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openModal(info.row.original)}
            className="p-1"
          >
            <PencilIcon className="w-4 h-4" />
          </Button>
          
          {/* Only show delete button if user has permission */}
          {canDeleteCustomer && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeleteClick(info.row.original)}
              className="p-1 text-red-600 hover:text-red-700"
            >
              <TrashBinIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    }),
  ], [openModal, canDeleteCustomer]);

  const filteredData = useMemo(() => {
    return customers.filter(item => {
      const matchesSearch =
        item.customer_code.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.contact_person.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.email.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.country.toLowerCase().includes(globalFilter.toLowerCase());

      return matchesSearch;
    });
  }, [customers, globalFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleAddNew = () => {
    openModal(undefined);
  };

  const handleDeleteClick = (customer: CustomerResponse) => {
    setDeletingItem(customer);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    // Check permission before allowing delete
    if (!canDeleteCustomer) {
      toast.error("You don't have permission to delete customer data");
      setDeleteModalOpen(false);
      setDeletingItem(null);
      return;
    }

    try {
      setModalLoading(true);
      await dispatch(deleteCustomer(deletingItem.id)).unwrap();
      toast.success('Customer deleted successfully');
      setDeleteModalOpen(false);
      setDeletingItem(null);
      
      // Refresh the list
      dispatch(fetchCustomers(filters));
    } catch (error: any) {
        console.error('Error deleting customer:', error);
      toast.error(error.message || 'Failed to delete customer');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSubmit = async (formData: CustomerFormData) => {
    try {
      setModalLoading(true);
      
      // Convert form data to API format
      const customerData: CreateCustomerRequest | UpdateCustomerRequest = {
        name: formData.name,
        customer_code: formData.customer_code,
        contact_person: formData.contact_person,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        country: formData.country,
        tax_id: formData.tax_id,
        is_active: formData.is_active,
      };
      
      if (editingItem) {
        // Update existing customer
        await dispatch(updateCustomer({ id: editingItem.id, customerData })).unwrap();
        toast.success('Customer updated successfully');
      } else {
        // Create new customer
        await dispatch(createCustomer(customerData as CreateCustomerRequest)).unwrap();
        toast.success('Customer created successfully');
      }
      
      // Refresh the list
      dispatch(fetchCustomers(filters));
      closeModal();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      toast.error(error.message || 'Failed to save customer');
    } finally {
      setModalLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const exportData = await dispatch(exportCustomers({
        ...filters,
        export: true,
        page_size: 1000
      })).unwrap();
      
      // Create CSV content
      const headers = ['Code', 'Company Name', 'Contact Person', 'Email', 'Phone', 'Address', 'Country', 'Tax ID', 'Status', 'Created On'];
      const csvRows = [
        headers.join(','),
        ...exportData.map(customer => [
          customer.customer_code,
          customer.name,
          customer.contact_person,
          customer.email,
          customer.phone,
          customer.address,
          customer.country,
          customer.tax_id,
          customer.is_active ? 'Active' : 'Inactive',
          customer.created_on ? new Date(customer.created_on).toLocaleDateString() : 'N/A'
        ].join(','))
      ];
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Customers exported successfully');
    } catch (error: any) {
      console.error('Error exporting customers:', error);
      toast.error('Failed to export customers');
    }
  };

  const handleFilterChange = (newFilters: Partial<CustomerListRequest>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handlePageChange = (page: number) => {
    handleFilterChange({ page });
  };

  const handleSearch = (searchTerm: string) => {
    setGlobalFilter(searchTerm);
    handleFilterChange({ 
      name: searchTerm,
      page: 1 
    });
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Customer Master
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage customer information and their configurations
        </p>
        
        {/* Permission indicator */}
        {!canDeleteCustomer && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">
                <strong>Read-only mode:</strong> You can view and edit customer data, but cannot delete records.
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
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Customers</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{total}</div>
          </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Active Customers</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {customers.filter(c => c.is_active).length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Countries</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {new Set(customers.map(c => c.country)).size}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">With Tax ID</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {customers.filter(c => c.tax_id).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search customers by code, name, contact person, email, or country..."
            value={globalFilter}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={handleExport} size="sm" variant="outline">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleAddNew} size="sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length} results
          </div>
          <Pagination
            currentPage={table.getState().pagination.pageIndex + 1}
            totalPages={table.getPageCount()}
            onPageChange={(page) => table.setPageIndex(page - 1)}
          />
      </div>

      {filteredData.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No customers found matching your search criteria.
        </div>
      )}

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Customer" : "Add New Customer"}
      >
        <CustomerForm
          initialData={editingItem ? {
            customer_code: editingItem.customer_code,
            name: editingItem.name,
            contact_person: editingItem.contact_person,
            email: editingItem.email,
            phone: editingItem.phone,
            address: editingItem.address,
            country: editingItem.country,
            tax_id: editingItem.tax_id,
            is_active: editingItem.is_active
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
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
        title="Delete Customer"
        message={`Are you sure you want to delete the customer "${deletingItem?.name}" (${deletingItem?.customer_code})? This action cannot be undone.`}
        itemName={deletingItem?.name}
        isLoading={isModalLoading}
        variant="danger"
      />
    </div>
  );
}



export default withSimpleRBAC(CustomerManager, {
  privilege: "VIEW_PORT_CUSTOMER_MASTER", // Minimum required privilege to access
  role: [1, 2, 3], // Admin users (role 1), Manager users (role 2), and Regular users (role 3) can access
  allowSuperUserBypass: true, // Superusers can always access
  redirectTo: "/user/dashboard" // Redirect if no access
});