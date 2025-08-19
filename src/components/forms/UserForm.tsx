"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { CreateUserRequest } from "@/types/api";
import toast from "react-hot-toast";

const userSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.number().min(0, "Please select a role").max(2, "Please select a role"),
  status: z.string(),
  organisation_name: z.string().min(1, "Organisation name is required"),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).superRefine((data, ctx) => {
  // Only validate password for new users (when editingItem is not provided)
  // This will be handled in the component logic, not in schema validation
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: {
    firstName: string;
    lastName: string;
    email: string;
    role: number;
    status: string;
    organisation_name: string;
  };
  onSubmit: (data: CreateUserRequest) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
  onCancel,
}) => {
  // No more access control state needed

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
      first_name: "",
      last_name: "",
      email: "",
      role: 2,
      status: "true",
      organisation_name: "",
      password: "",
      confirmPassword: "",
    },
  });

  const isEditing = !!initialData;
  const role = watch("role");
  const status = watch("status");

  // Set initial values when editing
  useEffect(() => {
    if (initialData) {
      reset({
        first_name: initialData.firstName,
        last_name: initialData.lastName,
        email: initialData.email,
        role: initialData.role,
        status: initialData.status === "active" ? "true" : "false",
        organisation_name: initialData.organisation_name,
        password: "",
        confirmPassword: "",
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (formData: UserFormData) => {
    console.log("Form submitted with data:", formData); // Debug log
    
    // Validate password for new users
    if (!isEditing) {
      if (!formData.password || formData.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    // Transform form data to match API requirements
    const apiData: CreateUserRequest = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      role: formData.role,
      status: formData.status === "true",
      organisation_name: formData.organisation_name,
    };
    
    console.log("Transformed API data:", apiData); // Debug log
    console.log("Calling onSubmit with:", apiData); // Debug log
    onSubmit(apiData);
  };

  // Access control removed - will be managed separately in Role Management

  return (
    <div className="space-y-6">
      {/* Form Content */}
      <form 
        onSubmit={(e) => {
          console.log("Form submit event triggered"); // Debug log
          e.preventDefault(); // Prevent default to see what's happening
          console.log("Form validation errors:", errors); // Debug log
          handleSubmit(handleFormSubmit)(e);
        }} 
        className="space-y-6"
      >
        <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  {...register("first_name")}
                  placeholder="Enter first name"
                  error={errors.first_name?.message}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  {...register("last_name")}
                  placeholder="Enter last name"
                  error={errors.last_name?.message}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="Enter email address"
                error={errors.email?.message}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="organisation_name">Organisation *</Label>
                <Input
                  id="organisation_name"
                  {...register("organisation_name")}
                  placeholder="Enter organisation name"
                  error={errors.organisation_name?.message}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <select
                  {...register("role", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <option value="">Select Role</option>
                  <option value={0}>User</option>
                  <option value={1}>Admin</option>
                  <option value={2}>Manager</option>
                </select>
                {errors.role && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.role.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    {...register("status")}
                    value="true"
                    className="mr-2"
                    disabled={isLoading}
                  />
                  Active
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    {...register("status")}
                    value="false"
                    className="mr-2"
                    disabled={isLoading}
                  />
                  Inactive
                </label>
              </div>
            </div>

            {/* Password Fields - Only show for new users */}
            {!isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    placeholder="Enter password"
                    error={errors.password?.message}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register("confirmPassword")}
                    placeholder="Confirm password"
                    error={errors.confirmPassword?.message}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : isEditing ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export type { UserFormData }; 