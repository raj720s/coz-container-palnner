"use client";

import React from 'react';
import { useSimplifiedRBAC } from '@/hooks/useSimplifiedRBAC';

// Base conditional render component
interface ConditionalRenderProps {
  children: React.ReactNode;
  route?: string;
  privilege?: string;
  action?: string;
  feature?: string;
  anyPrivileges?: string[];
  allPrivileges?: string[];
  fallback?: React.ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  children,
  route,
  privilege,
  action,
  feature,
  anyPrivileges,
  allPrivileges,
  fallback = null
}) => {
  const {
    hasRouteAccess,
    hasPrivilege,
    hasActionAccess,
    hasFeatureAccess,
    hasAnyPrivilege,
    hasAllPrivileges,
    isSuperUser
  } = useSimplifiedRBAC();

  // Superuser sees everything
  if (isSuperUser) {
    return <>{children}</>;
  }

  // Route access check
  if (route && !hasRouteAccess(route)) {
    return <>{fallback}</>;
  }

  // Privilege check
  if (privilege && !hasPrivilege(privilege)) {
    return <>{fallback}</>;
  }

  // Action access check
  if (action && !hasActionAccess(action)) {
    return <>{fallback}</>;
  }

  // Feature access check
  if (feature && !hasFeatureAccess(feature)) {
    return <>{fallback}</>;
  }

  // Any privileges check
  if (anyPrivileges && anyPrivileges.length > 0) {
    if (!hasAnyPrivilege(anyPrivileges)) {
      return <>{fallback}</>;
    }
  }

  // All privileges check
  if (allPrivileges && allPrivileges.length > 0) {
    if (!hasAllPrivileges(allPrivileges)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

// Convenience components for common use cases
export const RouteBasedRender: React.FC<{ route: string; children: React.ReactNode; fallback?: React.ReactNode }> = ({
  route,
  children,
  fallback
}) => (
  <ConditionalRender route={route} fallback={fallback}>
    {children}
  </ConditionalRender>
);

export const PrivilegeBasedRender: React.FC<{ privilege: string; children: React.ReactNode; fallback?: React.ReactNode }> = ({
  privilege,
  children,
  fallback
}) => (
  <ConditionalRender privilege={privilege} fallback={fallback}>
    {children}
  </ConditionalRender>
);

export const ActionBasedRender: React.FC<{ action: string; children: React.ReactNode; fallback?: React.ReactNode }> = ({
  action,
  children,
  fallback
}) => (
  <ConditionalRender action={action} fallback={fallback}>
    {children}
  </ConditionalRender>
);

export const FeatureBasedRender: React.FC<{ feature: string; children: React.ReactNode; fallback?: React.ReactNode }> = ({
  feature,
  children,
  fallback
}) => (
  <ConditionalRender feature={feature} fallback={fallback}>
    {children}
  </ConditionalRender>
);

// Role-based components
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => (
  <ConditionalRender anyPrivileges={['VIEW_ADMIN_DASHBOARD', 'ADMIN_ACCESS']} fallback={fallback}>
    {children}
  </ConditionalRender>
);

export const SuperUserOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => {
  const { isSuperUser } = useSimplifiedRBAC();
  
  if (!isSuperUser) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// Protected button component
interface ProtectedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  route?: string;
  privilege?: string;
  action?: string;
  feature?: string;
  anyPrivileges?: string[];
  allPrivileges?: string[];
  fallback?: React.ReactNode;
}

export const ProtectedButton: React.FC<ProtectedButtonProps> = ({
  route,
  privilege,
  action,
  feature,
  anyPrivileges,
  allPrivileges,
  fallback = null,
  children,
  ...buttonProps
}) => (
  <ConditionalRender
    route={route}
    privilege={privilege}
    action={action}
    feature={feature}
    anyPrivileges={anyPrivileges}
    allPrivileges={allPrivileges}
    fallback={fallback}
  >
    <button {...buttonProps}>
      {children}
    </button>
  </ConditionalRender>
);

// Protected link component
interface ProtectedLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  route?: string;
  privilege?: string;
  action?: string;
  feature?: string;
  anyPrivileges?: string[];
  allPrivileges?: string[];
  fallback?: React.ReactNode;
}

export const ProtectedLink: React.FC<ProtectedLinkProps> = ({
  href,
  route,
  privilege,
  action,
  feature,
  anyPrivileges,
  allPrivileges,
  fallback = null,
  children,
  ...linkProps
}) => (
  <ConditionalRender
    route={route}
    privilege={privilege}
    action={action}
    feature={feature}
    anyPrivileges={anyPrivileges}
    allPrivileges={allPrivileges}
    fallback={fallback}
  >
    <a href={href} {...linkProps}>
      {children}
    </a>
  </ConditionalRender>
);

// Navigation item component
interface ProtectedNavItemProps {
  route: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedNavItem: React.FC<ProtectedNavItemProps> = ({
  route,
  children,
  fallback = null
}) => (
  <RouteBasedRender route={route} fallback={fallback}>
    {children}
  </RouteBasedRender>
);

// Access denied component
export const AccessDenied: React.FC<{ message?: string }> = ({ 
  message = "You don't have permission to access this resource." 
}) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="text-6xl mb-4">🚫</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Access Denied
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        {message}
      </p>
    </div>
  </div>
);

// RBAC status component for debugging
export const RBACStatus: React.FC = () => {
  const {
    isAuthenticated,
    isSuperUser,
    roleName,
    privileges,
    accessibleRoutes,
    getPrivilegesByType
  } = useSimplifiedRBAC();

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Not Authenticated</h3>
      </div>
    );
  }

  const routePrivileges = getPrivilegesByType('route');
  const actionPrivileges = getPrivilegesByType('action');
  const featurePrivileges = getPrivilegesByType('feature');

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-blue-800 font-semibold mb-2">RBAC Status</h3>
      <div className="space-y-2 text-sm">
        <div><strong>Role:</strong> {roleName}</div>
        <div><strong>Superuser:</strong> {isSuperUser ? 'Yes' : 'No'}</div>
        <div><strong>Total Privileges:</strong> {privileges.length}</div>
        <div><strong>Route Privileges:</strong> {routePrivileges.length}</div>
        <div><strong>Action Privileges:</strong> {actionPrivileges.length}</div>
        <div><strong>Feature Privileges:</strong> {featurePrivileges.length}</div>
        <div><strong>Accessible Routes:</strong> {accessibleRoutes.length}</div>
      </div>
    </div>
  );
};

export default {
  ConditionalRender,
  RouteBasedRender,
  PrivilegeBasedRender,
  ActionBasedRender,
  FeatureBasedRender,
  AdminOnly,
  SuperUserOnly,
  ProtectedButton,
  ProtectedLink,
  ProtectedNavItem,
  AccessDenied,
  RBACStatus
};

