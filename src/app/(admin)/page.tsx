"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { withAdminAuth } from "@/components/auth/withAuth";

function AdminIndexPage() {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (!isAuthenticated) {
      // Redirect to sign in if not authenticated
      router.push("/signin");
      return;
    }

    // Redirect based on user role
    if (user?.role === "admin") {
      router.push("/admin/dashboard");
    } else if (user?.role === "user") {
      router.push("/user/dashboard");
    } else {
      // Fallback to sign in
      router.push("/signin");
    }
  }, [isAuthenticated, user, loading, router]);

  // Show loading while determining redirect
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Container Management System
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Admin Panel
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Redirecting to your dashboard...
        </p>
      </div>
    </div>
  );
}

export default withAdminAuth(AdminIndexPage); 