"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { withAdminAuth } from "./withAuth";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { 
  UserIcon, 
  ShieldIcon, 
  
  TrashBinIcon,
  PlusIcon
} from "@/icons";
import { 
  AVAILABLE_ROUTES, 
  DEFAULT_ROLE_ACCESS, 
  RouteKey,
  User,
  CreateUserData,
  UpdateUserData 
} from "@/types/user";
import {
  validateRouteAccess,
  getAccessibleRoutesForUser,
  canAccessRoutes,
  generateAccessControlForRole,
  addRouteAccess,
  removeRouteAccess,
  hasCategoryAccess
} from "@/utils/accessControl";
import { FiSave } from "react-icons/fi";

interface AccessControlManagerProps {
  onUserUpdate?: (userId: string, updates: UpdateUserData) => void;
  onUserCreate?: (userData: CreateUserData) => void;
  onUserDelete?: (userId: string) => void;
}

function AccessControlManager({ 
  onUserUpdate, 
  onUserCreate, 
  onUserDelete 
}: AccessControlManagerProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  // Mock users data - in real app, this would come from API
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: "1",
        name: "John Doe",
        email: "john.doe@example.com",
        role: "admin",
        status: "active",
        lastLogin: "2024-01-15T10:30:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        department: "IT",
        permissions: ["read", "write", "delete"],
        accessControl: DEFAULT_ROLE_ACCESS.admin
      },
      {
        id: "2",
        name: "Jane Smith",
        email: "jane.smith@example.com",
        role: "user",
        status: "active",
        lastLogin: "2024-01-15T09:15:00Z",
        createdAt: "2024-01-02T00:00:00Z",
        department: "Operations",
        permissions: ["read", "write"],
        accessControl: DEFAULT_ROLE_ACCESS.user
      },
      {
        id: "3",
        name: "Bob Johnson",
        email: "bob.johnson@example.com",
        role: "user",
        status: "active",
        lastLogin: "2024-01-14T16:45:00Z",
        createdAt: "2024-01-03T00:00:00Z",
        department: "Logistics",
        permissions: ["read"],
        accessControl: [...DEFAULT_ROLE_ACCESS.user, "user/shipment-history"]
      }
    ];
    setUsers(mockUsers);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setEditingUser({ ...user });
  };

  const handleAccessControlUpdate = (userId: string, route: RouteKey, hasAccess: boolean) => {
    if (!editingUser) return;

    let newAccessControl: string[];
    if (hasAccess) {
      newAccessControl = addRouteAccess(editingUser.accessControl, route);
    } else {
      newAccessControl = removeRouteAccess(editingUser.accessControl, route);
    }

    setEditingUser({
      ...editingUser,
      accessControl: newAccessControl
    });
  };

  const handleRoleChange = (userId: string, newRole: "admin" | "user") => {
    if (!editingUser) return;

    const newAccessControl = generateAccessControlForRole(newRole);
    setEditingUser({
      ...editingUser,
      role: newRole,
      accessControl: newAccessControl
    });
  };

  const handleSaveChanges = () => {
    if (!editingUser || !onUserUpdate) return;

    onUserUpdate(editingUser.id, {
      role: editingUser.role,
      accessControl: editingUser.accessControl
    });

    // Update local state
    setUsers(prev => prev.map(user => 
      user.id === editingUser.id ? editingUser : user
    ));
    setSelectedUser(editingUser);
    setEditingUser(null);
  };

  const handleCreateUser = (userData: CreateUserData) => {
    if (!onUserCreate) return;

    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      role: userData.role,
      status: userData.status,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      department: userData.department,
      permissions: userData.role === "admin" ? ["read", "write", "delete"] : ["read", "write"],
      accessControl: userData.accessControl || generateAccessControlForRole(userData.role)
    };

    onUserCreate(userData);
    setUsers(prev => [...prev, newUser]);
    setShowCreateForm(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (!onUserDelete) return;

    if (window.confirm("Are you sure you want to delete this user?")) {
      onUserDelete(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
        setEditingUser(null);
      }
    }
  };

  const getRouteCategory = (route: RouteKey): "admin" | "user" | "public" => {
    if (route.startsWith("admin/")) return "admin";
    if (route.startsWith("user/")) return "user";
    return "public";
  };

  const canUserAccessRoute = (user: User, route: RouteKey): boolean => {
    return user.accessControl.includes(route);
  };

  const getRouteStatus = (user: User, route: RouteKey) => {
    const hasAccess = canUserAccessRoute(user, route);
    const requiredRole = getRouteCategory(route);
    const userRole = user.role;

    if (hasAccess) {
      return { status: "granted", className: "text-green-600 bg-green-100" };
    }

    if (requiredRole === "admin" && userRole === "user") {
      return { status: "denied", className: "text-red-600 bg-red-100" };
    }

    if (requiredRole === "user" && userRole === "admin") {
      return { status: "available", className: "text-blue-600 bg-blue-100" };
    }

    return { status: "available", className: "text-gray-600 bg-gray-100" };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Access Control Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage user permissions and route access control
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Create User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Users
            </label>
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role Filter
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Users</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={`px-6 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 ${
                    selectedUser?.id === user.id ? 'bg-blue-50 dark:bg-blue-900' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        }`}>
                          {user.role}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {user.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Access Control Panel */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Access Control for {selectedUser.name}
                  </h2>
                  <div className="flex gap-2">
                    {editingUser && (
                      <>
                        <Button onClick={handleSaveChanges} size="sm" className="flex items-center gap-2">
                          <FiSave className="w-4 h-4" />
                          Save Changes
                        </Button>
                        <Button 
                          onClick={() => setEditingUser(null)} 
                          size="sm" 
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    <Button 
                      onClick={() => setEditingUser({ ...selectedUser })} 
                      size="sm" 
                      variant="outline"
                    >
                      Edit
                    </Button>
                    <Button 
                      onClick={() => handleDeleteUser(selectedUser.id)}
                      size="sm" 
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashBinIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* User Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role
                    </label>
                    {editingUser ? (
                      <select
                        value={editingUser.role}
                        onChange={(e) => handleRoleChange(editingUser.id, e.target.value as "admin" | "user")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`px-3 py-2 text-sm font-medium rounded-md ${
                        selectedUser.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {selectedUser.role}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedUser.department || "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Route Access Control */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Route Access Control
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {Object.entries(AVAILABLE_ROUTES).map(([route, displayName]) => {
                      const routeKey = route as RouteKey;
                      const category = getRouteCategory(routeKey);
                      const routeStatus = getRouteStatus(selectedUser, routeKey);
                      const canAccess = canUserAccessRoute(selectedUser, routeKey);
                      const isEditable = editingUser !== null;

                      return (
                        <div
                          key={route}
                          className={`p-3 border rounded-lg ${
                            canAccess 
                              ? 'border-green-200 bg-green-50 dark:bg-green-900/20' 
                              : 'border-gray-200 bg-gray-50 dark:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {displayName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {route}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  category === 'admin' 
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                                    : category === 'user'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                }`}>
                                  {category}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${routeStatus.className}`}>
                                  {routeStatus.status}
                                </span>
                              </div>
                            </div>
                            {isEditable && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={canAccess}
                                  onChange={(e) => handleAccessControlUpdate(selectedUser.id, routeKey, e.target.checked)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <ShieldIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>Select a user to manage their access control</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Create New User
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateUser({
                  name: formData.get('name') as string,
                  email: formData.get('email') as string,
                  role: formData.get('role') as "admin" | "user",
                  status: "active",
                  password: formData.get('password') as string,
                  department: formData.get('department') as string,
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name
                    </label>
                    <Input name="name" required className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <Input name="email" type="email" required className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role
                    </label>
                    <select
                      name="role"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Department
                    </label>
                    <Input name="department" className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password
                    </label>
                    <Input name="password" type="password" required className="w-full" />
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <Button className="flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" />
                    Create User
                  </Button>
                  <Button 
                    onClick={() => setShowCreateForm(false)} 
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAdminAuth(AccessControlManager);
