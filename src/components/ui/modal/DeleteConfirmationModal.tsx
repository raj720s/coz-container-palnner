"use client";

import React from "react";
import { FormModal } from "./FormModal";
import Button from "@/components/ui/button/Button";
import { TrashBinIcon, AlertIcon, RefreshIcon } from "@/icons";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  isLoading?: boolean;
  variant?: "danger" | "warning" | "info";
  error?: string | null;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Delete",
  message = "Are you sure you want to delete this item?",
  itemName,
  isLoading = false,
  variant = "danger",
  error = null
}: DeleteConfirmationModalProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "warning":
        return {
          icon: "text-yellow-500",
          button: "bg-yellow-600 hover:bg-yellow-700",
          border: "border-yellow-200 dark:border-yellow-800"
        };
      case "info":
        return {
          icon: "text-blue-500",
          button: "bg-blue-600 hover:bg-blue-700",
          border: "border-blue-200 dark:border-blue-800"
        };
      default: // danger
        return {
          icon: "text-red-500",
          button: "bg-red-600 hover:bg-red-700",
          border: "border-red-200 dark:border-red-800"
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      showHeader={true}
      showFooter={false}
    >
      <div key="modal-body" className="space-y-4">
        {/* Icon and Message */}
        <div key="modal-content" className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <AlertIcon className={`h-6 w-6 ${styles.icon}`} />
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
          
          {/* Error Display */}
          {error && (
            <div key="error-display" className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Error occurred while deleting
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {itemName && (
            <div key="item-name" className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Item to delete:
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {itemName}
              </p>
            </div>
          )}
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            This action cannot be undone.
          </p>
        </div>

        {/* Action Buttons */}
        <div key="action-buttons" className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          {error ? (
            // Show retry button when there's an error
            <Button
              key="retry-button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`${styles.button} text-white`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Retrying...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <RefreshIcon className="w-4 h-4" />
                  Try Again
                </div>
              )}
            </Button>
          ) : (
            // Show delete button when no error
            <Button
              key="delete-button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`${styles.button} text-white`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <TrashBinIcon className="w-4 h-4" />
                  Delete
                </div>
              )}
            </Button>
          )}
        </div>
      </div>
    </FormModal>
  );
}
