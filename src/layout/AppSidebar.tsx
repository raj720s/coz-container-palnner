"use client";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import {
  GridIcon,
  ChevronDownIcon,
  HorizontaLDots,
  UserCircleIcon,
  BoxIcon,
  FileIcon,
} from "../icons/index";


type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { 
    name: string; 
    path: string; 
    pro?: boolean; 
    new?: boolean;
    adminOnly?: boolean;
    userOnly?: boolean;
  }[];
  adminOnly?: boolean;
  userOnly?: boolean;
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [
      { name: "Admin Dashboard", path: "/admin/dashboard", adminOnly: true },
      { name: "User Dashboard", path: "/user/dashboard", userOnly: true },
    ],
  },
  {
    icon: <BoxIcon />,
    name: "Container Management",
    adminOnly: true,
    subItems: [
      { name: "Container Types", path: "/admin/container-types", new: true },
      { name: "Container Thresholds", path: "/admin/container-thresholds", new: true },
      { name: "Container Priority", path: "/admin/container-priority", new: true },
    ],
  },
  {
    icon: <FileIcon />,
    name: "Master Data",
    adminOnly: true,
    subItems: [
      { name: "Port & Customer Master", path: "/admin/port-customer-master", new: true },
      { name: "POL Ports", path: "/admin/port-customer-master/pol-ports", new: true },
      { name: "POD Ports", path: "/admin/port-customer-master/pod-ports", new: true },
      { name: "Customer Management", path: "/admin/port-customer-master/customers", new: true },
    ],
  },
  {
    icon: <FileIcon />,
    name: "Admin Shipment Operations",
    adminOnly: true,
    subItems: [
      { name: "Upload Shipments", path: "/admin/shipment-upload", new: true },
      { name: "Validation Summary", path: "/admin/validation-summary", new: true },
      { name: "Container Planning", path: "/admin/container-planning", new: true },
      { name: "Assignment Results", path: "/admin/assignment-results", new: true },
      { name: "Repositioning Summary", path: "/admin/repositioning-summary", new: true },
    ],
  },
  {
    icon: <FileIcon />,
    name: "User Shipment Operations",
    userOnly: true,
    subItems: [
      { name: "Test Page", path: "/user/test", new: true },
      { name: "Upload Shipments", path: "/user/shipment-upload", new: true },
      { name: "View History", path: "/user/view-history", new: true },
      { name: "Shipment History", path: "/user/shipment-history", new: true },
      { name: "Validation Summary", path: "/user/validation-summary", new: true },
      { name: "Test Validation", path: "/user/test-validation", new: true },
      { name: "Container Planning", path: "/user/container-planning", new: true },
      { name: "Assignment Results", path: "/user/assignment-results", new: true },
      { name: "Repositioning Summary", path: "/user/repositioning-summary", new: true },
      { name: "Data Backup", path: "/user/data-backup", new: true },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Admin Configuration",
    adminOnly: true,
    subItems: [
      { name: "User Management", path: "/admin/user-management", new: true },
      // { name: "System Settings", path: "/admin/system-settings", new: true },
      // { name: "Data Backup", path: "/admin/data-backup", new: true },
    ],
  },
  {
    icon: <BoxIcon />,
    name: "Shipment Operations",
    adminOnly: true,
    subItems: [
      { name: "Uploads History", path: "/admin/shipment-operations/uploads-history", new: true },
      { name: "Shipment History", path: "/admin/shipment-operations/shipment-history", new: true },
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
    
    return navItems.filter(item => {
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

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const renderMenuItems = useCallback((
    navItems: NavItem[],
    menuType: "main"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.path}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  ), [isActive, isExpanded, isHovered, isMobileOpen, openSubmenu, subMenuHeight]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    filteredNavItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({
              type: "main",
              index,
            });
            submenuMatched = true;
          }
        });
      }
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive, filteredNavItems]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = useCallback((index: number, menuType: "main") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  }, []);

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <h1 className="text-2xl font-bold">   
                <span className="text-brand-500">Container</span>
                <span className="text-gray-500">Planner</span>
              </h1>

            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots />
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
