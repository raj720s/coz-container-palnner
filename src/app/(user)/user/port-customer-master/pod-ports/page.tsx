"use client";

import { withUserAuth } from "@/components/auth/withAuth";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import React, { useState, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import { HiOutlineSearch, HiOutlineFilter, HiOutlineDownload, HiOutlineEye, HiOutlineLocationMarker, HiOutlineGlobe } from "react-icons/hi";

interface PODPort {
  id: string;
  portCode: string;
  portName: string;
  country: string;
  city: string;
  region: string;
  status: string;
  lastUpdated: string;
}

function UserPODPorts() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [data, setData] = useState<PODPort[]>([]);

  // Sample data - in real app this would come from API
  useEffect(() => {
    const sampleData: PODPort[] = [
      {
        id: "1",
        portCode: "USLAX",
        portName: "Los Angeles Port",
        country: "United States",
        city: "Los Angeles",
        region: "North America",
        status: "Active",
        lastUpdated: "2024-01-15"
      },
      {
        id: "2",
        portCode: "USNYC",
        portName: "New York Port",
        country: "United States",
        city: "New York",
        region: "North America",
        status: "Active",
        lastUpdated: "2024-01-14"
      },
      {
        id: "3",
        portCode: "DEHAM",
        portName: "Hamburg Port",
        country: "Germany",
        city: "Hamburg",
        region: "Europe",
        status: "Active",
        lastUpdated: "2024-01-13"
      },
      {
        id: "4",
        portCode: "NLRTM",
        portName: "Rotterdam Port",
        country: "Netherlands",
        city: "Rotterdam",
        region: "Europe",
        status: "Inactive",
        lastUpdated: "2024-01-12"
      }
    ];
    setData(sampleData);
  }, []);

  const filteredData = data.filter(item => {
    const matchesSearch = 
      item.portCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.portName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.country.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || item.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const handleExport = () => {
    toast.success("POD ports exported successfully");
  };

  const handleViewDetails = (id: string) => {
    toast.success(`Viewing details for POD port ${id}`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              POD Ports
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage Port of Discharge (POD) information
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.back()} variant="outline" size="sm">
              Back
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm">
              <HiOutlineDownload className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search ports, cities, countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Port Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Port Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Region
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <HiOutlineLocationMarker className="w-4 h-4 text-gray-400" />
                      {item.portCode}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {item.portName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {item.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <HiOutlineGlobe className="w-4 h-4 text-gray-400" />
                      {item.country}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {item.region}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.status === 'Active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {item.lastUpdated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <Button
                      onClick={() => handleViewDetails(item.id)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <HiOutlineEye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <HiOutlineSearch className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No POD ports found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {data.length}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Total POD Ports</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {data.filter(item => item.status === 'Active').length}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">Active Ports</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {new Set(data.map(item => item.country)).size}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">Countries</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {new Set(data.map(item => item.region)).size}
          </div>
          <div className="text-sm text-orange-600 dark:text-orange-400">Regions</div>
        </div>
      </div>
    </div>
  );
}

export default withUserAuth(UserPODPorts);
