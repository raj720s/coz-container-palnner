"use client";
import React from "react";
import { Modal } from "./index";
import Button from "@/components/ui/button/Button";
import { CloseIcon } from "@/icons";

interface FormModalProps<T = unknown> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit?: (data?: T) => void;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showFooter?: boolean;
}

export const FormModal = <T = unknown>({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitText = "Save",
  cancelText = "Cancel",
  isLoading = false,
  size = "md",
  showFooter = true,
}) => {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={sizeClasses[size]}>
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl">
        {/* <div className="relative bg-black  dark:bg-gray-900 rounded-lg shadow-xl"> */}
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {showFooter && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            {onSubmit && (
              <Button
                onClick={onSubmit}
                disabled={isLoading}
                className="min-w-[100px]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  submitText
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}; 