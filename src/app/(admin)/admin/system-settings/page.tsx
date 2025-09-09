"use client";


import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { CheckCircleIcon, AlertIcon, TimeIcon, SettingsIcon, ShieldIcon, DatabaseIcon, BellIcon, GlobeIcon } from "@/icons";
import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";

interface SystemSetting {
  id: string;
  category: string;
  name: string;
  value: string | boolean | number;
  type: "text" | "number" | "boolean" | "select";
  description: string;
  options?: string[];
}

function AdminSystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([
    {
      id: "1",
      category: "General",
      name: "System Name",
      value: "NXT Admin System",
      type: "text",
      description: "Display name for the system"
    },
    {
      id: "2",
      category: "General",
      name: "System Version",
      value: "1.2.0",
      type: "text",
      description: "Current system version"
    },
    {
      id: "3",
      category: "Security",
      name: "Session Timeout",
      value: 30,
      type: "number",
      description: "Session timeout in minutes"
    },
    {
      id: "4",
      category: "Security",
      name: "Password Policy",
      value: "strong",
      type: "select",
      description: "Password strength requirement",
      options: ["weak", "medium", "strong"]
    },
    {
      id: "5",
      category: "Security",
      name: "Two-Factor Authentication",
      value: true,
      type: "boolean",
      description: "Enable 2FA for all users"
    },
    {
      id: "6",
      category: "Notifications",
      name: "Email Notifications",
      value: true,
      type: "boolean",
      description: "Enable email notifications"
    },
    {
      id: "7",
      category: "Notifications",
      name: "SMS Notifications",
      value: false,
      type: "boolean",
      description: "Enable SMS notifications"
    },
    {
      id: "8",
      category: "Data",
      name: "Auto Backup",
      value: true,
      type: "boolean",
      description: "Enable automatic data backup"
    },
    {
      id: "9",
      category: "Data",
      name: "Backup Frequency",
      value: "daily",
      type: "select",
      description: "How often to backup data",
      options: ["hourly", "daily", "weekly", "monthly"]
    },
    {
      id: "10",
      category: "Performance",
      name: "Cache Duration",
      value: 3600,
      type: "number",
      description: "Cache duration in seconds"
    },
    {
      id: "11",
      category: "Performance",
      name: "Max Upload Size",
      value: 50,
      type: "number",
      description: "Maximum file upload size in MB"
    },
    {
      id: "12",
      category: "Integration",
      name: "API Rate Limit",
      value: 1000,
      type: "number",
      description: "API requests per minute"
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const categories = ["all", "General", "Security", "Notifications", "Data", "Performance", "Integration"];

  const filteredSettings = settings.filter(setting => 
    selectedCategory === "all" || setting.category === selectedCategory
  );

  const handleSettingChange = (id: string, value: string | boolean | number) => {
    setSettings(prev => prev.map(setting => 
      setting.id === id ? { ...setting, value } : setting
    ));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
    toast.success("Settings saved successfully");
  };

  const handleResetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      // Reset to default values
      toast.success("Settings reset to default");
      setHasChanges(false);
    }
  };

  const renderSettingInput = (setting: SystemSetting) => {
    switch (setting.type) {
      case "text":
        return (
          <Input
            value={setting.value as string}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            className="max-w-md"
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={setting.value as number}
            onChange={(e) => handleSettingChange(setting.id, Number(e.target.value))}
            className="max-w-md"
          />
        );
      case "boolean":
        return (
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={setting.value as boolean}
              onChange={(e) => handleSettingChange(setting.id, e.target.checked)}
              className="sr-only"
            />
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              setting.value ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                setting.value ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </div>
          </label>
        );
      case "select":
        return (
          <select
            value={setting.value as string}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white max-w-md"
          >
            {setting.options?.map(option => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "General":
        return <SettingsIcon className="w-5 h-5" />;
      case "Security":
        return <ShieldIcon className="w-5 h-5" />;
      case "Notifications":
        return <BellIcon className="w-5 h-5" />;
      case "Data":
        return <DatabaseIcon className="w-5 h-5" />;
      case "Performance":
        return <TimeIcon className="w-5 h-5" />;
      case "Integration":
        return <GlobeIcon className="w-5 h-5" />;
      default:
        return <SettingsIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure system-wide settings and preferences
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {category === "all" ? "All Categories" : category}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {filteredSettings.map(setting => (
          <div key={setting.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getCategoryIcon(setting.category)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {setting.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {setting.description}
                  </p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                {setting.category}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {renderSettingInput(setting)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSettings.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No settings found for the selected category.
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={handleSaveSettings}
          disabled={!hasChanges || isSaving}
          className={!hasChanges ? "opacity-50 cursor-not-allowed" : ""}
        >
          {isSaving ? (
            <>
              <TimeIcon className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
        <Button onClick={handleResetSettings} variant="outline">
          Reset to Default
        </Button>
      </div>

      {/* System Status */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          System Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-medium text-green-800 dark:text-green-200">
                  System Online
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400">
                  All services running normally
                </p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <DatabaseIcon className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-800 dark:text-blue-200">
                  Database
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Connected and healthy
                </p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <ShieldIcon className="w-6 h-6 text-purple-600" />
              <div>
                <h3 className="font-medium text-purple-800 dark:text-purple-200">
                  Security
                </h3>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  All security features active
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg border">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Settings updated
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  2 minutes ago by Admin User
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <AlertIcon className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Security policy updated
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  1 hour ago by System Admin
                </p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <TimeIcon className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Backup completed
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  3 hours ago by System
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withSimplifiedRBAC(AdminSystemSettingsPage, {
  
  route: "/admin/system-settings",
}); 