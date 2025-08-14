"use client";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { 
  HiOutlineHome, 
  HiOutlineCog, 
  HiOutlineDocumentText, 
  HiOutlineCube, 
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlineChevronDown,
  HiOutlineDotsHorizontal
} from "react-icons/hi";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string; // Make path required
  subItems?: { 
    name: string; 
    path: string; 
    pro?: boolean; 
    adminOnly?: boolean;
    userOnly?: boolean;
  }[];
  adminOnly?: boolean;
  userOnly?: boolean;
};

const navItems: NavItem[] = [
  {
    icon: <HiOutlineHome className="w-5 h-5" />,
    name: "Dashboard",
    path: "/dashboard", // This will be dynamically set based on role

    // subItems: [
    //   { name: "Admin Dashboard", path: "/admin/dashboard", adminOnly: true },
    //   { name: "User Dashboard", path: "/user/dashboard", userOnly: true },
    // ],
  },
  {
    icon: <HiOutlineCog className="w-5 h-5" />,
    name: "Master Data Management",
    path: "/admin/port-customer-master", // Admin parent link
    adminOnly: true,
    subItems: [
      { name: "Port & Customer Master", path: "/admin/port-customer-master" },
      { name: "POL Ports", path: "/admin/port-customer-master/pol-ports" },
      { name: "POD Ports", path: "/admin/port-customer-master/pod-ports" },
      { name: "Customer Management", path: "/admin/port-customer-master/customers" },
      { name: "Container Types", path: "/admin/container-types" },
      { name: "Container Thresholds", path: "/admin/container-thresholds" },
      { name: "Container Priority", path: "/admin/container-priority" },
    ],
  },
  {
    icon: <HiOutlineCog className="w-5 h-5" />,
    name: "Master Data Management",
    path: "/user/port-customer-master", // User parent link
    userOnly: true,
    subItems: [
      { name: "Port & Customer Master", path: "/user/port-customer-master" },
      { name: "POL Ports", path: "/user/port-customer-master/pol-ports" },
      { name: "POD Ports", path: "/user/port-customer-master/pod-ports" },
      { name: "Customer Management", path: "/user/port-customer-master/customers" },
      { name: "Container Types", path: "/user/container-types" },
      { name: "Container Thresholds", path: "/user/container-thresholds" },
      { name: "Container Priority", path: "/user/container-priority" },
    ],
  },
  {
    icon: <HiOutlineDocumentText className="w-5 h-5" />,
    name: "Shipment Operations",
    path: "/admin/shipment-upload", // Admin parent link
    adminOnly: true,
    subItems: [
      { name: "Upload Shipments", path: "/admin/shipment-upload" },
      { name: "Validation Summary", path: "/admin/validation-summary" },
      { name: "Container Planning", path: "/admin/container-planning" },
      { name: "Assignment Results", path: "/admin/assignment-results" },
      { name: "Repositioning Summary", path: "/admin/repositioning-summary" },
    ],
  },
  {
    icon: <HiOutlineDocumentText className="w-5 h-5" />,
    name: "Shipment Operations",
    path: "/user/shipment-upload", // User parent link
    userOnly: true,
    subItems: [
      { name: "Upload Shipments", path: "/user/shipment-upload" },
      { name: "Validation Summary", path: "/user/validation-summary" },
      { name: "Container Planning", path: "/user/container-planning" },
      { name: "Assignment Results", path: "/user/assignment-results" },
      { name: "Repositioning Summary", path: "/user/repositioning-summary" },
    ],
  },
  {
    icon: <HiOutlineUserGroup className="w-5 h-5" />,
    name: "Admin Configuration",
    path: "/admin/user-management", // Admin parent link
    adminOnly: true,
    subItems: [
      { name: "User Management", path: "/admin/user-management" },
      // { name: "System Settings", path: "/admin/system-settings" },
      // { name: "Data Backup", path: "/admin/data-backup" },
    ],
  },
  {
    icon: <HiOutlineCube className="w-5 h-5" />,
    name: "History",
    path: "/admin/shipment-operations/uploads-history", // Admin parent link
    adminOnly: true,
    subItems: [
      { name: "Uploads History", path: "/admin/shipment-operations/uploads-history" },
      // { name: "Shipment History", path: "/admin/shipment-operations/shipment-history" },
    ],
  },
  {
    icon: <HiOutlineCube className="w-5 h-5" />,
    name: "History",
    path: "/user/shipment-operations/uploads-history", // User parent link
    userOnly: true,
    subItems: [
      { name: "Uploads History", path: "/user/shipment-operations/uploads-history" },
      // { name: "Shipment History", path: "/user/shipment-operations/shipment-history" },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user } = useAuth();
  const pathname = usePathname();

  // Memoize the isActive function
  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  // Memoize filtered nav items to prevent infinite loops
  const filteredNavItems = useMemo(() => {
    if (!user) return navItems;
    
    return navItems.map(item => {
      // For Dashboard, set the path based on user role
      if (item.name === "Dashboard") {
        const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
        return { ...item, path: dashboardPath };
      }
      
      return item;
    }).filter(item => {
      if (item.adminOnly && user.role !== 'admin') return false;
      if (item.userOnly && user.role !== 'user') return false;
      
      if (item.subItems) {
        const filteredSubItems = item.subItems.filter(subItem => {
          if (subItem.adminOnly && user.role !== 'admin') return false;
          if (subItem.userOnly && user.role !== 'user') return false;
          return true;
        });
        return filteredSubItems.length > 0;
      }
      
      return true;
    });
  }, [user]);

  // Track which submenus are open
  const [openSubmenus, setOpenSubmenus] = useState<Set<number>>(new Set());

  const toggleSubmenu = useCallback((index: number) => {
    setOpenSubmenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const renderMenuItems = useCallback((
    navItems: NavItem[],
    menuType: "main"
  ) => (
    <ul className="flex flex-col gap-2">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <div>
              {/* Clickable parent menu item with toggle functionality */}
              <button
                onClick={() => toggleSubmenu(index)}
                className={`group w-full text-left px-3 py-3 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isActive(nav.path) 
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400" 
                    : "text-gray-700 dark:text-gray-300"
                } ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
                title={!isExpanded && !isHovered ? nav.name : undefined}
              >
                <div className={`flex items-center ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                }`}>
                  <span className={`flex-shrink-0 ${
                    isActive(nav.path)
                      ? "text-brand-600 dark:text-brand-400"
                      : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                  }`}>
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className={`ml-3 text-sm font-medium truncate`}>{nav.name}</span>
                  )}
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <HiOutlineChevronDown
                      className={`ml-auto w-4 h-4 transition-transform duration-200 ${
                        openSubmenus.has(index)
                          ? "rotate-180 text-brand-500"
                          : "text-gray-400"
                      }`}
                    />
                  )}
                </div>
              </button>
              {/* Collapsible submenu */}
              {(isExpanded || isHovered || isMobileOpen) && (
                <div className={`overflow-hidden transition-all duration-300 ${
                  openSubmenus.has(index) ? 'max-h-96' : 'max-h-0'
                }`}>
                  <ul className="mt-2 space-y-1 ml-6">
                    {nav.subItems.map((subItem) => (
                      <li key={subItem.path}>
                        <Link
                          href={subItem.path}
                          className={`block px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
                            isActive(subItem.path)
                              ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 font-medium"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          }`}
                        >
                          {subItem.name}
                          {subItem.pro && (
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              isActive(subItem.path)
                                ? "bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}>
                              pro
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={nav.path}
              className={`group block w-full px-3 py-3 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                isActive(nav.path) 
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400" 
                  : "text-gray-700 dark:text-gray-300"
              }`}
              title={!isExpanded && !isHovered ? nav.name : undefined}
            >
              <div className={`flex items-center ${
                !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
              }`}>
                <span className={`flex-shrink-0 ${
                  isActive(nav.path)
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                }`}>
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`ml-3 text-sm font-medium truncate`}>{nav.name}</span>
                )}
              </div>
            </Link>
          )}
        </li>
      ))}
    </ul>
  ), [isActive, isExpanded, isHovered, isMobileOpen, openSubmenus, toggleSubmenu]);

  useEffect(() => {
    // Automatically open submenu when current path matches any submenu item or parent
    let submenuMatched = false;
    filteredNavItems.forEach((nav, index) => {
      if (nav.subItems) {
        // Check if current path matches parent or any child
        if (isActive(nav.path) || nav.subItems.some(subItem => isActive(subItem.path))) {
          setOpenSubmenus(prev => new Set([...prev, index]));
          submenuMatched = true;
        }
      }
    });

    // If no submenu item matches, keep existing open submenus
    // (don't close them automatically)
  }, [pathname, isActive, filteredNavItems]);

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-3 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[280px]"
            : isHovered
            ? "w-[280px]"
            : "w-[80px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-6 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
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
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
        <nav className="mb-6">
          <div className="flex flex-col gap-2">
            <div>
              <h2
                className={`mb-4 text-xs uppercase font-semibold tracking-wider text-gray-500 dark:text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:text-center"
                    : "text-left"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <div className="flex justify-center">
                    <HiOutlineDotsHorizontal className="w-4 h-4" />
                  </div>
                )}
              </h2>
              {renderMenuItems(filteredNavItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;