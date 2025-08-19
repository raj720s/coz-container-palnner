"use client";

import { withAnyAuth } from "@/components/auth/withAuth";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import React from "react";
import Button from "@/components/ui/button/Button";
import { 
  UserCircleIcon, 
  BoxIcon, 
  FileIcon, 
  CheckCircleIcon, 
  BoltIcon,
  DownloadIcon,
  DocsIcon,
  TableIcon,
  PieChartIcon,
  AlertIcon,
  TimeIcon
} from "@/icons";

function HomePage() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/signin");
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      if (user?.role === 'admin') {
        router.push("/admin/dashboard");
      } else {
        router.push("/user/dashboard");
      }
    } else {
      router.push("/signin");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          COZ - Container Management System
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Efficient container logistics and planning solution
        </p>
        
        {isAuthenticated ? (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, {user?.name || user?.email}!
            </p>
            <div className="space-x-4">
              <Button onClick={handleGetStarted}>
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-x-4">
            <Button onClick={() => router.push("/signin")}>
              Sign In
            </Button>
            <Button variant="outline" onClick={() => router.push("/signup")}>
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAnyAuth(HomePage);
