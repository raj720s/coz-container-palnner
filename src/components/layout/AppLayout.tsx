"use client";

import AppHeader from "@/layout/AppHeader";
import Breadcrumb from "@/components/common/Breadcrumb";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="flex-1">
        <div className="px-6 py-4 container mx-auto max-w-full">
          {/* Breadcrumb navigation - appears above page content */}
          <div className="px-6">
            <Breadcrumb />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
