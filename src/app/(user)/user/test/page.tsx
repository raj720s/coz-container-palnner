"use client";

import { withUserAuth } from "@/components/auth/withAuth";
import { useAuth } from "@/context/AuthContext";

function TestPage() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Test Page</h1>
      <p className="mb-4">This page is accessible to users only.</p>
      <div className="bg-green-100 p-4 rounded-lg">
        <p><strong>User Info:</strong></p>
        <p>Name: {user?.name}</p>
        <p>Email: {user?.email}</p>
        <p>Role: {user?.role}</p>
      </div>
    </div>
  );
}

export default withUserAuth(TestPage); 