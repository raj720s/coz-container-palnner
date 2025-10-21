"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { staticModules } from "@/config/staticModules";
import {
  HiOutlineHome,
  HiOutlineCog,
  HiOutlineDocumentText,
  HiOutlineCube,
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlineChevronDown,
  HiOutlineDotsHorizontal,
  HiOutlineShieldCheck,
  HiOutlineKey,
  HiOutlineLink,
  HiOutlineTruck,
  HiOutlineOfficeBuilding,
  HiOutlineCalendar,
} from "react-icons/hi";
import { HiOutlineCircleStack } from "react-icons/hi2";

const moduleIcons: Record<string, React.ReactElement> = {
  "shield-check": <HiOutlineShieldCheck className="w-5 h-5" />,
  key: <HiOutlineKey className="w-5 h-5" />,
  link: <HiOutlineLink className="w-5 h-5" />,
  users: <HiOutlineUserGroup className="w-5 h-5" />,
  box: <HiOutlineCube className="w-5 h-5" />,
  "building-office": <HiOutlineOfficeBuilding className="w-5 h-5" />,
  truck: <HiOutlineTruck className="w-5 h-5" />,
  "chart-bar": <HiOutlineChartBar className="w-5 h-5" />,
  cog: <HiOutlineCog className="w-5 h-5" />,
  home: <HiOutlineHome className="w-5 h-5" />,
  document: <HiOutlineDocumentText className="w-5 h-5" />,
  "user": <HiOutlineUserGroup className="w-5 h-5" />,
  database: <HiOutlineCircleStack className="w-5 h-5" />,
  calendar: <HiOutlineCalendar className="w-5 h-5" />,
};

type SubItem = {
  name: string;
  path: string;
  moduleId: number;
  pro?: boolean;
};

type NavItem = {
  name: string;
  icon: React.ReactElement;
  path: string;
  moduleId: number;
  subItems?: SubItem[];
  adminOnly?: boolean;
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen } = useSidebar();
  const { user, canAccessModule } = useAuth();
  const { themeClasses } = useTheme();
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Set<number>>(new Set());

  const isActive = useCallback((p: string) => pathname === p, [pathname]);
  const isAdmin = user?.is_superuser || user?.role_id === 1;

  /** Build nav only when user or permissions change */
  const navItems = useMemo<NavItem[]>(() => {
    if (!user) return [];
    const items: NavItem[] = [];

    // Master Data Management
    items.push({
      name: "Master Data Management",
      icon: <HiOutlineCircleStack className="w-5 h-5" />,
      path: "#",
      moduleId: 1,
      subItems: [
        { name: "POL Master", path: "/port-customer-master/pol-ports", moduleId: 60 },
        { name: "POD Master", path: "/port-customer-master/pod-ports", moduleId: 60 },
        { name: "Customer Records", path: "/port-customer-master/customers", moduleId: 60 },
      ],
    });

    // Vendor Booking Management
    items.push({
      name: "Vendor Booking Management",
      icon: <HiOutlineCalendar className="w-5 h-5" />,
      path: "#",
      moduleId: 2,
      subItems: [
        { name: "Shipment Orders", path: "/shipment-orders", moduleId: 75 },
        { name: "Booking History", path: "/booking-history", moduleId: 75 },
        { name: "Vendor Management", path: "/vendor-management", moduleId: 75 },
      ],
    });

    // Admin Configuration (only for admins)
    if (isAdmin) {
      items.push({
        name: "Admin Configuration",
        icon: <HiOutlineCog className="w-5 h-5" />,
        path: "#",
        moduleId: 3,
        subItems: [
          { name: "User Management", path: "/user-management", moduleId: 40 },
          { name: "Role Management", path: "/role-management", moduleId: 10 },
        ],
      });
    }

    return items;
  }, [user, canAccessModule, isAdmin]);

  /** Auto-expand menu matching current route */
  useEffect(() => {
    navItems.forEach((nav) => {
      if (
        nav.subItems?.some((s) => isActive(s.path)) ||
        (nav.path !== "#" && isActive(nav.path))
      ) {
        setOpenMenus((prev) => new Set(prev).add(nav.moduleId));
      }
    });
  }, [pathname, navItems, isActive]);

  const toggleMenu = useCallback((id: number) => {
    setOpenMenus((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  if (!user) return null;

  return (
    <aside
      className={`fixed top-0 left-0 z-50 mt-16 lg:mt-0 h-screen border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-300 shadow-lg
        ${isExpanded || isMobileOpen ? "w-[280px]" : "w-[70px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
    >
      {/* Header */}
      <div className={`py-6 px-4 border-b border-gray-200 dark:border-gray-700 ${!isExpanded ? "lg:px-2 lg:py-4" : ""}`}>
        <Link href="/">
          {isExpanded || isMobileOpen ? (
            <div className="text-center">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Vendor Booking Tool
              </h1>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 lg:h-11 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">VBT</span>
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-2">
          {navItems.map((nav) => {
            const expanded = openMenus.has(nav.moduleId);
            const hasActiveChild = nav.subItems?.some((s) => isActive(s.path));
            
            if (nav.subItems) {
              return (
                <li key={nav.moduleId}>
                  <button
                    onClick={() => toggleMenu(nav.moduleId)}
                    title={!isExpanded ? nav.name : undefined}
                    className={`group w-full px-3 py-3 rounded-lg flex items-center transition-all duration-200
                      ${isExpanded || isMobileOpen ? "justify-between" : "lg:justify-center"}
                      ${hasActiveChild 
                        ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}
                    `}
                  >
                    <div className="flex items-center">
                      <span className={`flex-shrink-0 ${hasActiveChild ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"}`}>
                        {nav.icon}
                      </span>
                      {(isExpanded || isMobileOpen) && (
                        <span className="ml-3 text-sm font-medium truncate">
                          {nav.name}
                        </span>
                      )}
                    </div>
                    {(isExpanded || isMobileOpen) && (
                      <HiOutlineChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          expanded ? "rotate-180" : "rotate-0"
                        } ${hasActiveChild ? "text-purple-600 dark:text-purple-400" : "text-gray-400"}`}
                      />
                    )}
                  </button>
                  
                  {/* Submenu */}
                  {(isExpanded || isMobileOpen) && (
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <ul className="mt-2 ml-8 space-y-1">
                        {nav.subItems.map((s) => (
                          <li key={s.path}>
                            <Link
                              href={s.path}
                              className={`block px-3 py-2 text-sm rounded-md transition-colors
                                ${isActive(s.path)
                                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium"
                                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                            >
                              {s.name}
                              {s.pro && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                  pro
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            }
            
            // Single menu items (no submenus)
            return (
              <li key={nav.moduleId}>
                <Link
                  href={nav.path}
                  title={!isExpanded ? nav.name : undefined}
                  className={`group w-full px-3 py-3 rounded-lg flex items-center transition-colors
                    ${isExpanded || isMobileOpen ? "justify-start" : "lg:justify-center"}
                    ${isActive(nav.path)
                      ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}
                  `}
                >
                  <span className={`flex-shrink-0 ${isActive(nav.path) ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"}`}>
                    {nav.icon}
                  </span>
                  {(isExpanded || isMobileOpen) && (
                    <span className="ml-3 text-sm font-medium truncate">
                      {nav.name}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default AppSidebar;