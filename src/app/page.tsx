"use client";

import { withAnyAuth } from "@/components/auth/withAuth";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
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
  PieChartIcon
} from "@/icons";

function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  const adminShortcuts = [
    {
      title: "Container Types",
      description: "Manage container configurations and properties",
      icon: <BoxIcon className="w-8 h-8 text-blue-600" />,
      path: "/admin/container-types",
      color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
    },
    {
      title: "Container Thresholds",
      description: "Set min/max CBM values for containers",
      icon: <CheckCircleIcon className="w-8 h-8 text-green-600" />,
      path: "/admin/container-thresholds",
      color: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
    },
    {
      title: "Container Priority",
      description: "Manage container type priorities",
      icon: <BoltIcon className="w-8 h-8 text-yellow-600" />,
      path: "/admin/container-priority",
      color: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
    },
    {
      title: "Port & Customer Master",
      description: "Manage POL, POD, and customer data",
      icon: <UserCircleIcon className="w-8 h-8 text-purple-600" />,
      path: "/admin/port-customer-master",
      color: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
    },
    {
      title: "Shipment Upload",
      description: "Upload and process shipment data",
      icon: <DocsIcon className="w-8 h-8 text-indigo-600" />,
      path: "/admin/shipment-upload",
      color: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
    },
    {
      title: "Validation Summary",
      description: "Review validation results and errors",
      icon: <CheckCircleIcon className="w-8 h-8 text-emerald-600" />,
      path: "/admin/validation-summary",
      color: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
    },
    {
      title: "Container Planning",
      description: "Run container planning algorithms",
      icon: <PieChartIcon className="w-8 h-8 text-cyan-600" />,
      path: "/admin/container-planning",
      color: "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800"
    },
    {
      title: "Assignment Results",
      description: "View container assignment outcomes",
      icon: <TableIcon className="w-8 h-8 text-orange-600" />,
      path: "/admin/assignment-results",
      color: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
    },
    {
      title: "Repositioning Summary",
      description: "Review mode reassignments",
      icon: <FileIcon className="w-8 h-8 text-pink-600" />,
      path: "/admin/repositioning-summary",
      color: "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800"
    }
  ];

  const userShortcuts = [
    {
      title: "My Shipments",
      description: "View your shipment status",
      icon: <FileIcon className="w-8 h-8 text-blue-600" />,
      path: "/user/shipments",
      color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
    },
    {
      title: "Track Containers",
      description: "Track container assignments",
      icon: <BoxIcon className="w-8 h-8 text-green-600" />,
      path: "/user/tracking",
      color: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
    },
    {
      title: "Reports",
      description: "Generate and view reports",
      icon: <PieChartIcon className="w-8 h-8 text-purple-600" />,
      path: "/user/reports",
      color: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
    }
  ];

  const shortcuts = user?.role === "admin" ? adminShortcuts : userShortcuts;

  const handleShortcutClick = (path: string) => {
    router.push(path);
  };

  const handleGoToDashboard = () => {
    if (user?.role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/user/dashboard");
    }
  };

  return (
    <div className="p-6">
      {/* Greeting Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 dark:from-brand-600 dark:to-brand-700 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.name || "User"}! 👋
          </h1>
          <p className="text-brand-100 dark:text-brand-200 text-lg">
            {user?.role === "admin" 
              ? "Manage your container operations and optimize shipping processes."
              : "Track your shipments and monitor container assignments."
            }
          </p>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">
                Role: {user?.role === "admin" ? "Administrator" : "User"}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full">
                Last login: {new Date().toLocaleDateString()}
              </span>
            </div>
            <Button 
              onClick={handleGoToDashboard}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Containers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">1,247</p>
            </div>
            <BoxIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Shipments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">89</p>
            </div>
            <FileIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">FCL Mode</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">67%</p>
            </div>
            <BoltIcon className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">LCL Mode</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">33%</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Shortcuts Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {user?.role === "admin" ? "Admin Functions" : "Quick Actions"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${shortcut.color}`}
              onClick={() => handleShortcutClick(shortcut.path)}
            >
              <div className="flex items-start gap-4">
                {shortcut.icon}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {shortcut.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {shortcut.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Container planning completed for 15 shipments
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500 ml-auto">
              2 hours ago
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              New container type "45HC" added to system
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500 ml-auto">
              4 hours ago
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Shipment validation completed with 3 warnings
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500 ml-auto">
              6 hours ago
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAnyAuth(HomePage); 