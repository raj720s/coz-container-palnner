"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
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
} from "react-icons/hi";

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
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Set<number>>(new Set());

  const isActive = useCallback((p: string) => pathname === p, [pathname]);
  const isAdmin = user?.is_superuser || user?.role_id === 1;

  /** Build nav only when user or permissions change */
  const navItems = useMemo<NavItem[]>(() => {
    if (!user) return [];
    const items: NavItem[] = [];

    const dashboard = staticModules[100];
    if (dashboard && canAccessModule(100)) {
      items.push({
        name: dashboard.name,
        icon: moduleIcons[dashboard.icon || "home"],
        path: dashboard.routes[0],
        moduleId: dashboard.id,
      });
    }

    items.push({
      name: "Master Data Management",
      icon: <HiOutlineCog className="w-5 h-5" />,
      path: "#",
      moduleId: 1,
      subItems: [
        { name: "POL Master", path: "/port-customer-master/pol-ports", moduleId: 60 },
        { name: "POD Master", path: "/port-customer-master/pod-ports", moduleId: 60 },
        { name: "Customer Records", path: "/port-customer-master/customers", moduleId: 60 },
        { name: "Container Type Master", path: "/container-types", moduleId: 50 },
        { name: "Threshold Configuration", path: "/container-thresholds", moduleId: 50 },
        { name: "Priority Configuration", path: "/container-priority", moduleId: 50 },
      ],
    });

    items.push({
      name: "Shipment Operations",
      icon: <HiOutlineTruck className="w-5 h-5" />,
      path: "#",
      moduleId: 2,
      subItems: [
        { name: "Upload Shipments", path: "/shipment-upload", moduleId: 70 },
        { name: "Validation Summary", path: "/validation-summary", moduleId: 80 },
        { name: "Container Planning", path: "/container-planning", moduleId: 50 },
        { name: "Assignment Results", path: "/assignment-results", moduleId: 80 },
      ],
    });

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

    items.push({
      name: "History",
      icon: <HiOutlineDocumentText className="w-5 h-5" />,
      path: "#",
      moduleId: 4,
      subItems: [{ name: "Uploads History", path: "/shipment-operations/uploads-history", moduleId: 70 }],
    });

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
      className={`fixed top-0 left-0 z-50 mt-16 lg:mt-0 h-screen border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 transition-all duration-300
        ${isExpanded || isMobileOpen ? "w-[280px]" : "w-[80px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
    >
      <div className={`py-6 flex ${!isExpanded ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/">
          {isExpanded || isMobileOpen ? (
            <h1 className="text-xl font-bold">
              <span className="text-brand-500">Container</span>
              <span className="text-gray-500">Planner</span>
            </h1>
          ) : (
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CP</span>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar px-3">
        <h2
          className={`mb-4 text-xs uppercase font-semibold tracking-wider text-gray-500 dark:text-gray-400 ${
            !isExpanded ? "lg:text-center" : "text-left"
          }`}
        >
          {isExpanded || isMobileOpen ? "" : <HiOutlineDotsHorizontal className="mx-auto w-4 h-4" />}
        </h2>

        <ul className="flex flex-col gap-2">
          {navItems.map((nav) => {
            const expanded = openMenus.has(nav.moduleId);
            if (nav.subItems) {
              return (
                <li key={nav.moduleId}>
                  <button
                    onClick={() => toggleMenu(nav.moduleId)}
                    title={!isExpanded ? nav.name : undefined}
                    className={`group w-full px-3 py-3 rounded-lg flex items-center transition-colors
                      ${isExpanded ? "justify-start" : "lg:justify-center"}
                      ${expanded ? "bg-gray-100 dark:bg-gray-800" : ""}
                    `}
                  >
                    <span className="flex-shrink-0 text-gray-500 group-hover:text-gray-700 dark:text-gray-400">
                      {nav.icon}
                    </span>
                    {(isExpanded || isMobileOpen) && (
                      <>
                        <span className="ml-3 text-sm font-medium truncate">{nav.name}</span>
                        <HiOutlineChevronDown
                          className={`ml-auto w-4 h-4 transition-transform ${
                            expanded ? "rotate-180 text-brand-500" : "rotate-0 text-gray-400"
                          }`}
                        />
                      </>
                    )}
                  </button>
                  {(isExpanded || isMobileOpen) && (
                    <ul
                      className={`ml-6 mt-1 overflow-hidden transition-[max-height] duration-300
                        ${expanded ? "max-h-96" : "max-h-0"}`}
                    >
                      {nav.subItems.map((s) => (
                        <li key={s.path}>
                          <Link
                            href={s.path}
                            className={`block px-3 py-2 text-sm rounded-md transition-colors
                              ${isActive(s.path)
                                ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 font-medium"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              }`}
                          >
                            {s.name}
                            {s.pro && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                pro
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }
            return (
              <li key={nav.moduleId}>
                <Link
                  href={nav.path}
                  title={!isExpanded ? nav.name : undefined}
                  className={`group w-full px-3 py-3 rounded-lg flex items-center transition-colors
                    ${isExpanded ? "justify-start" : "lg:justify-center"}
                    ${isActive(nav.path)
                      ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}
                  `}
                >
                  <span className="flex-shrink-0 text-gray-500 group-hover:text-gray-700 dark:text-gray-400">
                    {nav.icon}
                  </span>
                  {(isExpanded || isMobileOpen) && (
                    <span className="ml-3 text-sm font-medium truncate">{nav.name}</span>
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