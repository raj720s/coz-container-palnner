"use client";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/slices/consolidatedUserSlice';
import staticModuleDefinitions from '@/config/staticModules';

import { 
  HiOutlineHome, 
  HiOutlineCog, 
  HiOutlineDocumentText, 
  HiOutlineCube, 
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlineChevronDown,
  HiOutlineDotsHorizontal,
  HiOutlineGlobe,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle
} from "react-icons/hi";
import { useSimplifiedRBAC } from "@/hooks/useSimplifiedRBAC";

// Icon mapping for modules
const moduleIcons: Record<string, React.ReactNode> = {
  'UserCircleIcon': <HiOutlineUserGroup className="w-5 h-5" />,
  'CheckCircleIcon': <HiOutlineCheckCircle className="w-5 h-5" />,
  'AlertIcon': <HiOutlineExclamationCircle className="w-5 h-5" />,
  'CogIcon': <HiOutlineCog className="w-5 h-5" />,
  'CubeIcon': <HiOutlineCube className="w-5 h-5" />,
  'GlobeIcon': <HiOutlineGlobe className="w-5 h-5" />,
  'DocumentIcon': <HiOutlineDocumentText className="w-5 h-5" />,
  'ChartIcon': <HiOutlineChartBar className="w-5 h-5" />,
  'HomeIcon': <HiOutlineHome className="w-5 h-5" />
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
  moduleId: number;
  subItems?: { 
    name: string; 
    path: string; 
    moduleId: number;
    pro?: boolean; 
    adminOnly?: boolean;
    userOnly?: boolean;
  }[];
  adminOnly?: boolean;
  userOnly?: boolean;
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user: contextUser } = useAuth();
  const reduxUser = useSelector(selectUser);
  const pathname = usePathname();
  // Only get the values we actually need from the hook
  const { userRole, isAdmin } = useSimplifiedRBAC();
  
  // Use Redux user if available, fallback to context user
  const user = reduxUser || contextUser;

  console.log("user", user);
  
  // Helper function to check if user is admin (legacy support)
  const isUserAdmin = (user: any): boolean => {

    console.log("reduxUser", reduxUser);
    if (reduxUser?.is_superuser !== undefined) {
      console.log("reduxUser.is_superuser", reduxUser.is_superuser);
      return reduxUser.is_superuser;
    }
    return user?.role === 'admin' || isAdmin();
  };

  // Memoize the user admin status to prevent infinite loops
  const userIsAdmin = useMemo(() => isUserAdmin(user), [user, reduxUser?.is_superuser, isAdmin]);

  // Memoize the isActive function
  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  // Generate static navigation items based on user role
  const generateNavItems = useCallback((): NavItem[] => {
    const navItems: NavItem[] = [];
    
    // Admin Menu (Role 1)
    if (userRole === 1 || reduxUser?.is_superuser) {
      // Dashboard
      navItems.push({
        icon: <HiOutlineChartBar className="w-5 h-5" />,
        name: "Dashboard",
        path: "/admin/dashboard",
        moduleId: 80
      });

      // Master Data Management
      navItems.push({
        icon: <HiOutlineCog className="w-5 h-5" />,
        name: "Master Data Management",
        path: "/admin/port-customer-master",
        moduleId: 40,
        subItems: [
          { name: "POL Master", path: "/admin/port-customer-master/pol-ports", moduleId: 41 },
          { name: "POD Master", path: "/admin/port-customer-master/pod-ports", moduleId: 42 },
          { name: "Customer Records", path: "/admin/port-customer-master/customers", moduleId: 43 },
          { name: "Container Type Master", path: "/admin/container-types", moduleId: 30 },
          { name: "Threshold Configuration", path: "/admin/container-thresholds", moduleId: 31 },
          { name: "Priority Configuration", path: "/admin/container-priority", moduleId: 32 }
        ]
      });

      // Shipment Operations
      navItems.push({
        icon: <HiOutlineCube className="w-5 h-5" />,
        name: "Shipment Operations",
        path: "/admin/shipment-upload",
        moduleId: 50,
        subItems: [
          { name: "Upload Shipments", path: "/admin/shipment-upload", moduleId: 51 },
          { name: "Validation Summary", path: "/admin/validation-summary", moduleId: 52 },
          { name: "Container Planning", path: "/admin/container-planning", moduleId: 53 },
          { name: "Assignment Results", path: "/admin/assignment-results", moduleId: 54 }
        ]
      });

      // Admin Configuration
      navItems.push({
        icon: <HiOutlineUserGroup className="w-5 h-5" />,
        name: "Admin Configuration",
        path: "/admin/user-management",
        moduleId: 10,
        subItems: [
          { name: "User Management", path: "/admin/user-management", moduleId: 11 },
          { name: "Role Management", path: "/admin/role-management", moduleId: 12 }
        ]
      });

      // History
      navItems.push({
        icon: <HiOutlineDocumentText className="w-5 h-5" />,
        name: "History",
        path: "/admin/shipment-operations/uploads-history",
        moduleId: 70,
        subItems: [
          { name: "Uploads History", path: "/admin/shipment-operations/uploads-history", moduleId: 71 }
        ]
      });
    } else {
      // User Menu (Role 2+ and other roles)
      
      // Dashboard
      navItems.push({
        icon: <HiOutlineChartBar className="w-5 h-5" />,
        name: "Dashboard",
        path: "/user/dashboard",
        moduleId: 80
      });

      // Master Data Management
      navItems.push({
        icon: <HiOutlineCog className="w-5 h-5" />,
        name: "Master Data Management",
        path: "/user/port-customer-master",
        moduleId: 40,
        subItems: [
          { name: "POL Master", path: "/user/port-customer-master/pol-ports", moduleId: 41 },
          { name: "POD Master", path: "/user/port-customer-master/pod-ports", moduleId: 42 },
          { name: "Customer Records", path: "/user/port-customer-master/customers", moduleId: 43 },
          { name: "Container Type Master", path: "/user/container-types", moduleId: 30 },
          { name: "Threshold Configuration", path: "/user/container-thresholds", moduleId: 31 },
          { name: "Priority Configuration", path: "/user/container-priority", moduleId: 32 }
        ]
      });

      // Shipment Operations
      navItems.push({
        icon: <HiOutlineCube className="w-5 h-5" />,
        name: "Shipment Operations",
        path: "/user/shipment-upload",
        moduleId: 50,
        subItems: [
          { name: "Upload Shipments", path: "/user/shipment-upload", moduleId: 51 },
          { name: "Validation Summary", path: "/user/validation-summary", moduleId: 52 },
          { name: "Container Planning", path: "/user/container-planning", moduleId: 53 },
          { name: "Assignment Results", path: "/user/assignment-results", moduleId: 54 }
        ]
      });

      // History
      navItems.push({
        icon: <HiOutlineDocumentText className="w-5 h-5" />,
        name: "History",
        path: "/user/shipment-operations/uploads-history",
        moduleId: 70,
        subItems: [
          { name: "Uploads History", path: "/user/shipment-operations/uploads-history", moduleId: 71 }
        ]
      });
    }

    return navItems;
  }, [userRole]);


  

  // Memoize filtered nav items using RBAC
  const filteredNavItems = useMemo(() => {
    if (!user) return [];

    const navItems = generateNavItems();
    
    // For now, return all nav items since sidebar doesn't handle roleID dynamically
    // This prevents unnecessary re-renders
    return navItems;
  }, [user, userRole, generateNavItems]);

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
        <li key={`${nav.name}-${nav.moduleId}`}>
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
                          : "rotate-0 text-gray-400"
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
                    {nav.subItems.map((subItem, subIndex) => (
                      <li key={`${nav.moduleId}-${subItem.moduleId}-${subIndex}`}>
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
                  ""
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