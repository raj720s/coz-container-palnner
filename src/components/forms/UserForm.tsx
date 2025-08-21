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
import { useRoles } from "@/hooks/useRoles";
import { userService } from "@/services/userService";
import { roleService } from "@/services/roleService";
import toast from "react-hot-toast";

const userSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.string().min(1, "Please select a role"),
  status: z.string(),
  organisation_name: z.string().min(1, "Organisation name is required"),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).superRefine((data, ctx) => {
  // Password validation is now optional since the API doesn't require it
  // The form will still show password fields for new users but won't enforce them
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    role: number;
    status: string;
    organisation_name?: string;
  };
  onSuccess?: () => void; // Called when operation succeeds
  onCancel?: () => void;
  isEditing?: boolean; // Whether this is editing an existing user
}

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  isEditing = false,
}) => {
  // Use the roles hook to get roles from Redux state
  const { roles, loading: rolesLoading, roleOptions } = useRoles();
  const [isSubmitting, setIsSubmitting] = useState(false);
  console.log("🔄 UserForm rendered with:", {
    initialData,
    isEditing,
    roles,
    rolesLoading,
    roleOptions,
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
      first_name: "",
      last_name: "",
      email: "",
      role: "",
      status: "true",
      organisation_name: "",
      password: "",
      confirmPassword: "",
    },
  });

  const role = watch("role");
  const status = watch("status");

  // Set initial values when editing
  useEffect(() => {
    if (initialData) {
      reset({
        first_name: initialData.firstName,
        last_name: initialData.lastName,
        email: initialData.email,
        role: initialData.role.toString(), // Convert number to string for form
        status: initialData.status === "active" ? "true" : "false",
        organisation_name: initialData.organisation_name || "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (formData: UserFormData) => {
    console.log("🎯 Form submitted with data:", formData);
    
    // if (isSubmitting) {
    //   console.log("🚫 Form submission already in progress");
    //   return; // Prevent double submission
    // }
    
    // Find the selected role to get the role ID
    const selectedRole = roles.find(r => r.id.toString() === formData.role);
    if (!selectedRole) {
      console.log("🚫 No role selected or role not found");
      toast.error("Please select a valid role");
      return;
    }

    // Transform form data to match API requirements
    const apiData: CreateUserRequest = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      role: parseInt(selectedRole.id), // Convert string ID to number for API
      status: formData.status === "true",
      organisation_name: formData.organisation_name,
    };
    
    console.log("📦 Transformed API data:", apiData);
    
    try {
      setIsSubmitting(true);
      
      if (isEditing) {
        // Handle user update
        console.log("🔄 Updating existing user...");
        
        if (!initialData) {
          throw new Error("Initial data required for editing");
        }
        
        const response = await userService.updateUser(parseInt(initialData.id as any), apiData);
        console.log("✅ User updated successfully:", response);
        toast.success("User updated successfully");
        
      } else {
        // Handle user creation
        console.log("🆕 Creating new user...");
        
        // Step 1: Create the user
        const response = await userService.createUser(apiData);
        console.log("✅ User created successfully:", response);
        
        // Step 2: Extract user ID and assign role
        try {
          let userId: number;
          
          if ('id' in response && typeof response.id === 'number') {
            userId = response.id;
            console.log("📊 Extracted user ID from response.id:", userId);
          } else if ('data' in response && response.data && typeof response.data === 'object' && response.data !== null && 'id' in response.data && typeof (response.data as any).id === 'number') {
            userId = (response.data as any).id;
            console.log("📊 Extracted user ID from response.data.id:", userId);
          } else {
            console.error("❌ Could not extract user ID from response:", response);
            throw new Error("Could not extract user ID from response");
          }
          
          console.log("🔗 Assigning role to user:", { roleId: selectedRole.id, userId });
          
          // Assign the role to the user
          await roleService.assignUsersToRole(selectedRole.id, [userId]);
          console.log("✅ Role assigned successfully to user:", userId);
          
          toast.success("User created and role assigned successfully");
          
        } catch (roleError) {
          console.error("❌ Role assignment failed:", roleError);
          toast.success("User created successfully, but role assignment failed. Please assign role manually.");
        }
      }
      
      // Call success callback to close modal and refresh data
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error("❌ Form submission error:", error);
      toast.error(isEditing ? "Failed to update user" : "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Access control removed - will be managed separately in Role Management

  return (
    <div className="space-y-6">
      {/* Form Content */}
      <form 
        onSubmit={(e) => {
          console.log("📝 Form submit event triggered");
          e.preventDefault();
          handleSubmit(handleFormSubmit)(e);
        }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              {...register("first_name")}
              placeholder="Enter first name"
              className="w-full"
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              {...register("last_name")}
              placeholder="Enter last name"
              className="w-full"
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              {...register("email")}
              type="email"
              placeholder="Enter email address"
              className="w-full"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              options={[
                { value: "", label: "Select a role" },
                ...roleOptions.map((roleOption) => ({
                  value: roleOption.value,
                  label: roleOption.label
                }))
              ]}
              value={watch("role")}
              onChange={(value) => setValue("role", value)}
              placeholder="Select a role"
              className="w-full"
              disabled={rolesLoading}
            />
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
            {rolesLoading && (
              <p className="mt-1 text-sm text-gray-500">Loading roles...</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" }
              ]}
              value={watch("status")}
              onChange={(value) => setValue("status", value)}
              placeholder="Select status"
              className="w-full"
            />
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="organisation_name">Organisation Name</Label>
            <Input
              id="organisation_name"
              {...register("organisation_name")}
              placeholder="Enter organisation name"
              className="w-full"
            />
            {errors.organisation_name && (
              <p className="mt-1 text-sm text-red-600">{errors.organisation_name.message}</p>
            )}
          </div>
        </div>

        {!isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="password">Password (Optional)</Label>
              <Input
                id="password"
                {...register("password")}
                type="password"
                placeholder="Enter password (optional)"
                className="w-full"
              />
              <p className="mt-1 text-sm text-gray-500">Password is not required by the API</p>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password (Optional)</Label>
              <Input
                id="confirmPassword"
                {...register("confirmPassword")}
                type="password"
                placeholder="Confirm password (optional)"
                className="w-full"
              />
              <p className="mt-1 text-sm text-gray-500">Password is not required by the API</p>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          {onCancel && (
            <Button
              data-form-action="cancel"
              onClick={onCancel}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            data-form-action="submit"
            onClick={() => handleSubmit(handleFormSubmit)()}
            disabled={isSubmitting || rolesLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export type { UserFormData }; 