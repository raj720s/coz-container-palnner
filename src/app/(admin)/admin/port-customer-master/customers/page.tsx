"use client";

import { withRouteAuth } from "@/components/auth/withAuth";
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
  SortingState,
} from "@tanstack/react-table";
import Input from "@/components/form/input/InputField";
import { DownloadIcon, PencilIcon, TrashBinIcon, PlusIcon, ChevronLeftIcon } from "@/icons";
import { FormModal } from "@/components/ui/modal/FormModal";
import { useFormModal } from "@/hooks/useFormModal";
import { useMessage } from "@/components/ui/MessageBox";

interface Customer {
  id: string;
  code: string;
  name: string;
  country: string;
  region: string;
  contactPerson: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const columnHelper = createColumnHelper<Customer>();

// Mock data for customers
const mockCustomers: Customer[] = [
  {
    id: "1",
    code: "BON",
    name: "BON PRIX",
    country: "Germany",
    region: "Europe",
    contactPerson: "Hans Mueller",
    email: "hans.mueller@bonprix.de",
    phone: "+49 40 12345678",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01"
  },
  {
    id: "2",
    code: "OTTO",
    name: "OTTO GME",
    country: "Germany",
    region: "Europe",
    contactPerson: "Anna Schmidt",
    email: "anna.schmidt@otto.de",
    phone: "+49 40 87654321",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01"
  },
  {
    id: "3",
    code: "ABC",
    name: "ABC Corp",
    country: "United States",
    region: "North America",
    contactPerson: "John Smith",
    email: "john.smith@abccorp.com",
    phone: "+1 555 1234567",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01"
  }
];

function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams?.get('action') || '';
  const { showSuccess, showError } = useMessage();
  
  // Customers data
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const {
    isOpen: isModalOpen,
    isLoading: isModalLoading,
    editingItem,
    openModal,
    closeModal,
    setLoading: setModalLoading,
  } = useFormModal();

  // Auto-open modal if action=add
  useEffect(() => {
    if (action === 'add') {
      openModal(undefined);
    }
  }, [action, openModal]);

  const columns = useMemo(() => [
    columnHelper.accessor("code", { 
      header: "Customer Code", 
      cell: (info) => <span className="font-mono text-sm font-semibold">{info.getValue()}</span>
    }),
    columnHelper.accessor("name", { 
      header: "Customer Name", 
      cell: (info) => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor("country", { 
      header: "Country", 
      cell: (info) => info.getValue() 
    }),
    columnHelper.accessor("region", { 
      header: "Region", 
      cell: (info) => (
        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-full">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("contactPerson", { 
      header: "Contact Person", 
      cell: (info) => <span className="text-sm">{info.getValue()}</span>
    }),
    columnHelper.accessor("email", { 
      header: "Email", 
      cell: (info) => (
        <span className="text-sm text-blue-600 dark:text-blue-400">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("isActive", {
      header: "Status",
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(info.row.original.id)}
            className="p-1 text-red-600 hover:text-red-700"
          >
            <TrashBinIcon className="w-4 h-4" />
          </Button>
        </div>
      ),
    }),
  ], [openModal]);

  const filteredData = useMemo(() => {
    return customers.filter(item => {
      const matchesSearch =
        item.code.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.country.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.region.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.contactPerson.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.email.toLowerCase().includes(globalFilter.toLowerCase());

      return matchesSearch;
    });
  }, [customers, globalFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  const handleAddNew = () => {
    openModal(undefined);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        const updatedCustomers = customers.filter(customer => customer.id !== id);
        setCustomers(updatedCustomers);
        showSuccess('Success', 'Customer deleted successfully');
      } catch (error) {
        console.error('Error deleting customer:', error);
        showError('Error', 'Failed to delete customer');
      }
    }
  };

  const handleSubmit = async (formData: Customer) => {
    try {
      setModalLoading(true);
      
      if (editingItem) {
        // Update existing customer
        const updatedCustomers = customers.map(customer => 
          customer.id === (editingItem as Customer).id 
            ? { ...customer, ...formData, updatedAt: new Date().toISOString() }
            : customer
        );
        setCustomers(updatedCustomers);
        showSuccess('Success', 'Customer updated successfully');
      } else {
        // Create new customer
        const newCustomer: Customer = {
          ...formData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setCustomers([...customers, newCustomer]);
        showSuccess('Success', 'Customer created successfully');
      }
      
      closeModal();
    } catch (error) {
      console.error('Error saving customer:', error);
      showError('Error', 'Failed to save customer');
    } finally {
      setModalLoading(false);
    }
  };

  const exportData = () => {
    const headers = ["Customer Code", "Customer Name", "Country", "Region", "Contact Person", "Email", "Phone", "Status", "Created"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map(row => [
        row.code,
        row.name,
        row.country,
        row.region,
        row.contactPerson,
        row.email,
        row.phone,
        row.isActive ? "Active" : "Inactive",
        new Date(row.createdAt).toLocaleDateString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    showSuccess('Success', 'Export completed successfully');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Customer Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage customer information and configurations
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportData} size="sm" variant="outline">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleAddNew} size="sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {customers.length}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Total Customers</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {customers.filter(item => item.isActive).length}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">Active Customers</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {new Set(customers.map(item => item.country)).size}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">Countries</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {new Set(customers.map(item => item.region)).size}
          </div>
          <div className="text-sm text-orange-600 dark:text-orange-400">Regions</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <Input
          placeholder="Search customers by code, name, country, region, contact person, or email..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-md"
        />
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

      {filteredData.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No customers found matching your search criteria.
        </div>
      )}

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onSubmit={handleSubmit}
        onClose={closeModal}
        title={editingItem ? "Edit Customer" : "Add New Customer"}
        isLoading={isModalLoading}
      >
        <CustomerForm
          initialData={editingItem as Customer | undefined}
          onSubmit={handleSubmit}
        />
      </FormModal>
    </div>
  );
}

// Simple Customer Form Component
function CustomerForm({ initialData, onSubmit }: { initialData?: Customer; onSubmit: (data: Customer) => void }) {
  const [formData, setFormData] = useState({
    code: initialData?.code || '',
    name: initialData?.name || '',
    country: initialData?.country || '',
    region: initialData?.region || '',
    contactPerson: initialData?.contactPerson || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    isActive: initialData?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: initialData?.id || '',
      createdAt: initialData?.createdAt || '',
      updatedAt: initialData?.updatedAt || ''
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Customer Code
          </label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g., BON"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Customer Name
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., BON PRIX"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Country
          </label>
          <Input
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder="e.g., Germany"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Region
          </label>
          <Input
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            placeholder="e.g., Europe"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contact Person
          </label>
          <Input
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            placeholder="e.g., Hans Mueller"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="e.g., hans.mueller@bonprix.de"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Phone
        </label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="e.g., +49 40 12345678"
          required
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
          Active
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button size="sm">
          {initialData ? "Update Customer" : "Create Customer"}
        </Button>
      </div>
    </form>
  );
}

export default withRouteAuth(CustomersPage, "admin/port-customer-master/customers");

