import React from 'react';
import { useSimpleRBAC } from '@/hooks/useSimpleRBAC';
import Button from '../ui/button/Button';
import Link from 'next/link';

// Base interface for all RBAC components
interface RBACBaseProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hide?: boolean;
}

// Conditional rendering based on privileges
interface ConditionalRenderProps extends RBACBaseProps {
  privilege?: string;
  anyPrivileges?: string[];
  allPrivileges?: string[];
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  privilege,
  anyPrivileges,
  allPrivileges,
  fallback = null,
  hide = false,
  children
}) => {
  const { hasPrivilege, hasAnyPrivilege, hasAllPrivileges } = useSimpleRBAC();

  let hasAccess = true;

  if (privilege) {
    hasAccess = hasAccess && hasPrivilege(privilege);
  }
  if (anyPrivileges && anyPrivileges.length > 0) {
    hasAccess = hasAccess && hasAnyPrivilege(anyPrivileges);
  }
  if (allPrivileges && allPrivileges.length > 0) {
    hasAccess = hasAccess && hasAllPrivileges(allPrivileges);
  }

  if (!hasAccess) {
    return hide ? null : <>{fallback}</>;
  }

  return <>{children}</>;
};

// Role-based rendering
interface RoleBasedRenderProps extends RBACBaseProps {
  role: number | number[];
}

export const RoleBasedRender: React.FC<RoleBasedRenderProps> = ({
  role,
  fallback = null,
  hide = false,
  children
}) => {
  const { getUserRole } = useSimpleRBAC();
  const userRole = getUserRole();
  
  const allowedRoles = Array.isArray(role) ? role : [role];
  const hasAccess = allowedRoles.includes(userRole);

  if (!hasAccess) {
    return hide ? null : <>{fallback}</>;
  }

  return <>{children}</>;
};

// Action-based rendering
interface ActionBasedRenderProps extends RBACBaseProps {
  action: string;
  module?: string;
}

export const ActionBasedRender: React.FC<ActionBasedRenderProps> = ({
  action,
  module,
  fallback = null,
  hide = false,
  children
}) => {
  const { canPerformAction } = useSimpleRBAC();
  const hasAccess = canPerformAction(action, module);

  if (!hasAccess) {
    return hide ? null : <>{fallback}</>;
  }

  return <>{children}</>;
};

// Protected button component
interface ProtectedButtonProps {
  privilege?: string;
  anyPrivileges?: string[];
  allPrivileges?: string[];
  action?: string;
  actionModule?: string;
  fallback?: React.ReactNode;
  hide?: boolean;
  variant?: "primary" | "outline" | "danger" | "success" | "secondary";
  size?: "sm" | "md";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const ProtectedButton: React.FC<ProtectedButtonProps> = ({
  privilege,
  anyPrivileges,
  allPrivileges,
  action,
  actionModule,
  fallback = null,
  hide = false,
  children,
  ...props
}) => {
  const { hasPrivilege, hasAnyPrivilege, hasAllPrivileges, canPerformAction } = useSimpleRBAC();

  let hasAccess = true;

  if (privilege) {
    hasAccess = hasAccess && hasPrivilege(privilege);
  }
  if (anyPrivileges && anyPrivileges.length > 0) {
    hasAccess = hasAccess && hasAnyPrivilege(anyPrivileges);
  }
  if (allPrivileges && allPrivileges.length > 0) {
    hasAccess = hasAccess && hasAllPrivileges(allPrivileges);
  }
  if (action) {
    hasAccess = hasAccess && canPerformAction(action, actionModule);
  }

  if (!hasAccess) {
    return hide ? null : <>{fallback}</>;
  }

  return <Button {...props}>{children}</Button>;
};

// Protected link component
interface ProtectedLinkProps {
  href: string;
  privilege?: string;
  anyPrivileges?: string[];
  allPrivileges?: string[];
  route?: string;
  fallback?: React.ReactNode;
  hide?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ProtectedLink: React.FC<ProtectedLinkProps> = ({
  href,
  privilege,
  anyPrivileges,
  allPrivileges,
  route,
  fallback = null,
  hide = false,
  children,
  className
}) => {
  const { hasPrivilege, hasAnyPrivilege, hasAllPrivileges, canAccessRoute } = useSimpleRBAC();

  let hasAccess = true;

  if (privilege) {
    hasAccess = hasAccess && hasPrivilege(privilege);
  }
  if (anyPrivileges && anyPrivileges.length > 0) {
    hasAccess = hasAccess && hasAnyPrivilege(anyPrivileges);
  }
  if (allPrivileges && allPrivileges.length > 0) {
    hasAccess = hasAccess && hasAllPrivileges(allPrivileges);
  }
  if (route) {
    hasAccess = hasAccess && canAccessRoute(route);
  }

  if (!hasAccess) {
    return hide ? null : <>{fallback}</>;
  }

  return <Link href={href} className={className}>{children}</Link>;
};

// Convenience components for common roles
export const AdminOnly: React.FC<RBACBaseProps> = ({ children, fallback, hide }) => {
  const { isAdmin } = useSimpleRBAC();
  
  if (!isAdmin()) {
    return hide ? null : <>{fallback}</>;
  }
  
  return <>{children}</>;
};

export const SuperUserOnly: React.FC<RBACBaseProps> = ({ children, fallback, hide }) => {
  const { isSuperUser } = useSimpleRBAC();
  
  if (!isSuperUser()) {
    return hide ? null : <>{fallback}</>;
  }
  
  return <>{children}</>;
};

export const ManagerOnly: React.FC<RBACBaseProps> = ({ children, fallback, hide }) => {
  const { isManager } = useSimpleRBAC();
  
  if (!isManager()) {
    return hide ? null : <>{fallback}</>;
  }
  
  return <>{children}</>;
};

export const UserOnly: React.FC<RBACBaseProps> = ({ children, fallback, hide }) => {
  const { isUser } = useSimpleRBAC();
  
  if (!isUser()) {
    return hide ? null : <>{fallback}</>;
  }
  
  return <>{children}</>;
};


