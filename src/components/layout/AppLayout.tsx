"use client";

import AppHeader from "@/layout/AppHeader";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="flex-1">
        <div className="p-4 mx-auto max-w-full md:p-6">{children}</div>
      </div>
    </div>
  );
};

export default AppLayout;
