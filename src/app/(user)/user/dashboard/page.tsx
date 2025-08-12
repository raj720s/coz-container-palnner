"use client";

import { withUserAuth } from "@/components/auth/withAuth";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import React from "react";
import Button from "@/components/ui/button/Button";
import { 
  UserCircleIcon, 
  BoxIcon, 
  FileIcon, 
  CheckCircleIcon, 
  BoltIcon,
  DownloadIcon,
  DocsIcon,
  TableIcon,
  PieChartIcon,
  AlertIcon,
  TimeIcon
} from "@/icons";

function UserDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/signin");
    toast.success("Logged out successfully");
  };

  // User Shipment Metrics
  const shipmentMetrics = [
    {
      title: "My Shipments",
      value: "12",
      change: "+2",
      trend: "up",
      icon: <FileIcon className="w-6 h-6 text-blue-600" />,
      color: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "In Transit",
      value: "8",
      change: "+1",
      trend: "up",
      icon: <BoltIcon className="w-6 h-6 text-green-600" />,
      color: "bg-green-50 dark:bg-green-900/20"
    },
    {
      title: "Delivered",
      value: "156",
      change: "+12",
      trend: "up",
      icon: <CheckCircleIcon className="w-6 h-6 text-emerald-600" />,
      color: "bg-emerald-50 dark:bg-emerald-900/20"
    },
    {
      title: "Pending",
      value: "3",
      change: "-1",
      trend: "down",
      icon: <TimeIcon className="w-6 h-6 text-orange-600" />,
      color: "bg-orange-50 dark:bg-orange-900/20"
    }
  ];

  // Container Tracking Metrics
  const containerMetrics = [
    {
      title: "Tracked Containers",
      value: "24",
      change: "+3",
      trend: "up",
      icon: <BoxIcon className="w-6 h-6 text-purple-600" />,
      color: "bg-purple-50 dark:bg-purple-900/20"
    },
    {
      title: "FCL Shipments",
      value: "18",
      change: "+2",
      trend: "up",
      icon: <PieChartIcon className="w-6 h-6 text-indigo-600" />,
      color: "bg-indigo-50 dark:bg-indigo-900/20"
    },
    {
      title: "LCL Shipments",
      value: "6",
      change: "+1",
      trend: "up",
      icon: <TableIcon className="w-6 h-6 text-cyan-600" />,
      color: "bg-cyan-50 dark:bg-cyan-900/20"
    },
    {
      title: "Total CBM",
      value: "1,247",
      change: "+89",
      trend: "up",
      icon: <CheckCircleIcon className="w-6 h-6 text-teal-600" />,
      color: "bg-teal-50 dark:bg-teal-900/20"
    }
  ];

  // Quick Actions
  const quickActions = [
    {
      title: "Upload Shipments",
      description: "Submit new shipment data",
      icon: <DocsIcon className="w-8 h-8 text-blue-600" />,
      path: "/user/shipment-upload",
      color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
    },
    {
      title: "Track Shipments",
      description: "Monitor shipment status",
      icon: <TableIcon className="w-8 h-8 text-green-600" />,
      path: "/user/shipment-tracking",
      color: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
    },
    {
      title: "View Results",
      description: "Check planning outcomes",
      icon: <PieChartIcon className="w-8 h-8 text-purple-600" />,
      path: "/user/assignment-results",
      color: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
    },
    {
      title: "Download Reports",
      description: "Export shipment data",
      icon: <DownloadIcon className="w-8 h-8 text-yellow-600" />,
      path: "/user/reports",
      color: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
    }
  ];

  const handleQuickAction = (path: string) => {
    router.push(path);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              User Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your shipments and monitor logistics
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            Logout
          </Button>
        </div>
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 dark:from-brand-600 dark:to-brand-700 rounded-lg p-6 text-white">
          <h2 className="text-xl font-semibold mb-2">
            Welcome back, {user?.name || "User"}!
          </h2>
          <p className="text-brand-100 dark:text-brand-200">
            Monitor your shipments, track containers, and manage your logistics operations.
          </p>
        </div>
      </div>

      {/* User Shipment Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          My Shipments
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {shipmentMetrics.map((metric, index) => (
            <div key={index} className={`${metric.color} rounded-lg p-4 border`}>
              <div className="flex items-center justify-between mb-2">
                {metric.icon}
                <span className={`text-xs px-2 py-1 rounded-full ${
                  metric.trend === "up" 
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}>
                  {metric.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {metric.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {metric.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Container Tracking Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Container Tracking
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {containerMetrics.map((metric, index) => (
            <div key={index} className={`${metric.color} rounded-lg p-4 border`}>
              <div className="flex items-center justify-between mb-2">
                {metric.icon}
                <span className={`text-xs px-2 py-1 rounded-full ${
                  metric.trend === "up" 
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}>
                  {metric.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {metric.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {metric.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${action.color}`}
              onClick={() => handleQuickAction(action.path)}
            >
              <div className="flex items-start gap-4">
                {action.icon}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default withUserAuth(UserDashboard); 