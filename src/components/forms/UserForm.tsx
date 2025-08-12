"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { User, DEFAULT_ROLE_ACCESS } from "@/types/user";
import { AccessControlForm } from "./AccessControlForm";

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "user"], { required_error: "Please select a role" }),
  status: z.enum(["active", "inactive", "pending"], { required_error: "Please select a status" }),
  department: z.string().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  accessControl: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  // If no initial data (creating new user), password is required
  if (!data.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password is required for new users",
      path: ["password"],
    });
  }
  
  // If password is provided, it must be at least 6 characters
  if (data.password && data.password.length < 6) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password must be at least 6 characters",
      path: ["password"],
    });
  }
  
  // If password is provided, confirm password must match
  if (data.password && data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
  }
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: User;
  onSubmit: (data: UserFormData) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "access">("details");
  const [accessControlData, setAccessControlData] = useState<{
    role: "admin" | "user";
    accessControl: string[];
  }>({
    role: initialData?.role || "user",
    accessControl: initialData?.accessControl || DEFAULT_ROLE_ACCESS.user,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
      status: "active",
      department: "",
      password: "",
      confirmPassword: "",
      accessControl: DEFAULT_ROLE_ACCESS.user,
    },
  });

  const isEditing = !!initialData;
  const role = watch("role");
  const status = watch("status");

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        email: initialData.email,
        role: initialData.role,
        status: initialData.status,
        department: initialData.department || "",
        password: "",
        confirmPassword: "",
        accessControl: initialData.accessControl || DEFAULT_ROLE_ACCESS[initialData.role],
      });
      setAccessControlData({
        role: initialData.role,
        accessControl: initialData.accessControl || DEFAULT_ROLE_ACCESS[initialData.role],
      });
    } else {
      // Reset form when creating new user
      reset({
        name: "",
        email: "",
        role: "user",
        status: "active",
        department: "",
        password: "",
        confirmPassword: "",
        accessControl: DEFAULT_ROLE_ACCESS.user,
      });
      setAccessControlData({
        role: "user",
        accessControl: DEFAULT_ROLE_ACCESS.user,
      });
    }
  }, [initialData, reset]);

  // Update access control when role changes
  useEffect(() => {
    setAccessControlData(prev => ({
      ...prev,
      role,
      accessControl: DEFAULT_ROLE_ACCESS[role],
    }));
    setValue("accessControl", DEFAULT_ROLE_ACCESS[role]);
  }, [role, setValue]);

  const handleFormSubmit = (data: UserFormData) => {
    // Merge access control data with form data
    const finalData = {
      ...data,
      accessControl: accessControlData.accessControl,
    };
    onSubmit(finalData);
  };

  const handleAccessControlSubmit = (data: { accessControl: string[] }) => {
    setAccessControlData(prev => ({
      ...prev,
      accessControl: data.accessControl,
    }));
    setValue("accessControl", data.accessControl);
    setActiveTab("details");
  };

  const roleOptions = [
    { value: "user", label: "User" },
    { value: "admin", label: "Admin" },
  ];

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "pending", label: "Pending" },
  ];

  const departmentOptions = [
    { value: "Operations", label: "Operations" },
    { value: "Logistics", label: "Logistics" },
    { value: "Sales", label: "Sales" },
    { value: "IT", label: "IT" },
    { value: "Finance", label: "Finance" },
    { value: "Marketing", label: "Marketing" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "details"
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            User Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("access")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "access"
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Access Control
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "details" ? (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" required>
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="Enter full name"
                {...register("name")}
                error={errors.name?.message}
              />
            </div>

            <div>
              <Label htmlFor="email" required>
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                {...register("email")}
                error={errors.email?.message}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="role" required>
                Role
              </Label>
              <Select
                options={roleOptions}
                value={role}
                onChange={(value) => setValue("role", value as "admin" | "user")}
                placeholder="Select role"
                error={errors.role?.message}
              />
            </div>

            <div>
              <Label htmlFor="status" required>
                Status
              </Label>
              <Select
                options={statusOptions}
                value={status}
                onChange={(value) => setValue("status", value as "active" | "inactive" | "pending")}
                placeholder="Select status"
                error={errors.status?.message}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="department">
              Department
            </Label>
            <Select
              options={departmentOptions}
              value={watch("department") || ""}
              onChange={(value) => setValue("department", value)}
              placeholder="Select department"
              error={errors.department?.message}
            />
          </div>

          {!isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="password" required>
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  {...register("password")}
                  error={errors.password?.message}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" required>
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  {...register("confirmPassword")}
                  error={errors.confirmPassword?.message}
                />
              </div>
            </div>
          )}

          {/* Access Control Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Access Control Summary</h4>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Role: {role}</p>
              <p>Allowed Routes: {accessControlData.accessControl.length}</p>
              <button
                type="button"
                onClick={() => setActiveTab("access")}
                className="text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 text-sm font-medium"
              >
                Manage Access Control →
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSubmit(handleFormSubmit)}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                isEditing ? "Update User" : "Create User"
              )}
            </Button>
          </div>
        </form>
      ) : (
        <AccessControlForm
          initialData={accessControlData}
          onSubmit={handleAccessControlSubmit}
          onCancel={() => setActiveTab("details")}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}; 