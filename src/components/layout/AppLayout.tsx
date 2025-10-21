"use client";

import { useMemo } from "react";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Calculate main margin based on sidebar state
  const mainMargin = useMemo(
    () =>
      isMobileOpen
        ? "ml-0"
        : isExpanded || isHovered
        ? "lg:ml-[280px]"
        : "lg:ml-[70px]",
    [isMobileOpen, isExpanded, isHovered]
  );

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <div className={`flex-1 transition-all duration-300 ease-in-out ${mainMargin}`}>
        <AppHeader />
        <div className="p-4 mx-auto max-w-full md:p-6">{children}</div>
      </div>
      <Backdrop />
    </div>
  );
};

export default AppLayout;
