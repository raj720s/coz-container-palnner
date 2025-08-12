"use client";

import React, { useState } from "react";
import { AVAILABLE_ROUTES } from "@/types/user";
import { getUserAccessibleRoutes } from "@/utils/accessControl";
import { ShieldIcon, EyeIcon } from "@/icons";

interface AccessControlDisplayProps {
  accessControl: string[];
  compact?: boolean;
}

export const AccessControlDisplay: React.FC<AccessControlDisplayProps> = ({
  accessControl,
  compact = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { adminRoutes, userRoutes } = getUserAccessibleRoutes(accessControl);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <ShieldIcon className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {accessControl.length} routes
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
        >
          {isExpanded ? "Hide" : "Show"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Access Control ({accessControl.length} routes)
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
        >
          {isExpanded ? "Hide Details" : "Show Details"}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {adminRoutes.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Admin Routes ({adminRoutes.length})
              </h4>
              <div className="grid grid-cols-1 gap-1">
                {adminRoutes.map((route) => (
                  <div key={route} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <EyeIcon className="w-3 h-3" />
                    {AVAILABLE_ROUTES[route as keyof typeof AVAILABLE_ROUTES]}
                  </div>
                ))}
              </div>
            </div>
          )}

          {userRoutes.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                User Routes ({userRoutes.length})
              </h4>
              <div className="grid grid-cols-1 gap-1">
                {userRoutes.map((route) => (
                  <div key={route} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <EyeIcon className="w-3 h-3" />
                    {AVAILABLE_ROUTES[route as keyof typeof AVAILABLE_ROUTES]}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 