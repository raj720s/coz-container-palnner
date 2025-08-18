"use client";
import React, { useState, useEffect } from 'react';
import { useGetUserProfileQuery, useUpdateUserProfileMutation } from '@/store/api/apiSlice';
import { useAuth } from '@/context/AuthContext';

import toast from 'react-hot-toast';
import Button from '@/components/ui/button/Button';
import InputField from '@/components/form/input/InputField';
import Label from '@/components/form/Label';

export default function AdminProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    organisation_name: '',
    phone_number: '',
  });

  // RTK Query hooks
  const { data: userProfile, isLoading, error, refetch } = useGetUserProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateUserProfileMutation();

  // Initialize form data when profile loads
  useEffect(() => {
    if (userProfile) {
      setFormData({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        email: userProfile.email || '',
        organisation_name: userProfile.organisation_name || '',
        phone_number: userProfile.phone_number || '',
      });
    }
  }, [userProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile(formData).unwrap();
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      refetch(); // Refresh the profile data
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (userProfile) {
      setFormData({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        email: userProfile.email || '',
        organisation_name: userProfile.organisation_name || '',
        phone_number: userProfile.phone_number || '',
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-4">Unable to load your profile information.</p>
          <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Profile Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your administrator account information and preferences
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Personal Information
            </h2>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <InputField
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <InputField
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <InputField
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="phone_number">Phone Number</Label>
              <InputField
                id="phone_number"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="organisation_name">Organization Name</Label>
              <InputField
                id="organisation_name"
                name="organisation_name"
                type="text"
                value={formData.organisation_name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                
                onClick={handleCancel}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                
                variant="primary"
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* Account Information Section */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Administrator Account Information
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-500">User ID</Label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {userProfile?.id || 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Role</Label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  {userProfile?.role?.[0]?.role_name || (userProfile?.is_superuser ? "Administrator" : "User")}
                </span>
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Account Status</Label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  userProfile?.status 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {userProfile?.status ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Member Since</Label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {userProfile?.created_on 
                  ? new Date(userProfile.created_on).toLocaleDateString()
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
