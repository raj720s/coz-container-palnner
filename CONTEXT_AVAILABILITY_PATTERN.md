# Context Availability Pattern

## Overview
This document explains the implementation of the `contextAvailable` property in both `AuthContext` and `SidebarContext` to ensure components only consume context data when it's ready.

## Problem Solved
Previously, components could try to access context data before the context was fully initialized, leading to:
- Undefined values
- Runtime errors
- Inconsistent state
- Poor user experience

## Solution
Added `contextAvailable` property to both contexts that indicates when the context data is ready for consumption.

## Implementation

### 1. AuthContext Changes

#### Interface Update
```typescript
export interface AuthContextType {
  // ... existing properties
  contextAvailable: boolean; // New property to indicate context is ready
  // ... rest of properties
}
```

#### State Management
```typescript
const [contextAvailable, setContextAvailable] = useState(false);

// Set to true when initialization is complete
useEffect(() => {
  const initializeAuth = async () => {
    try {
      // ... initialization logic
    } finally {
      setLoading(false);
      setContextAvailable(true); // Context is now available
    }
  };
  initializeAuth();
}, []);
```

#### Reset on Logout
```typescript
const logout = () => {
  // ... clear state
  setContextAvailable(false); // Reset availability
};
```

### 2. SidebarContext Changes

#### Interface Update
```typescript
type SidebarContextType = {
  // ... existing properties
  contextAvailable: boolean; // New property to indicate context is ready
  // ... rest of properties
};
```

#### State Management
```typescript
const [contextAvailable, setContextAvailable] = useState(false);

// Set to true immediately after mount (sidebar is simple)
useEffect(() => {
  setContextAvailable(true);
}, []);
```

### 3. Safe Hooks

#### useAuthSafe Hook
```typescript
// src/hooks/useAuthSafe.ts
export const useAuthSafe = () => {
  const auth = useAuth();
  
  if (!auth.contextAvailable) {
    throw new Error("AuthContext is not available yet. Make sure the component is wrapped in AuthProvider and context is initialized.");
  }
  
  return auth;
};
```

#### useSidebarSafe Hook
```typescript
// src/hooks/useSidebarSafe.ts
export const useSidebarSafe = () => {
  const sidebar = useSidebar();
  
  if (!sidebar.contextAvailable) {
    throw new Error("SidebarContext is not available yet. Make sure the component is wrapped in SidebarProvider and context is initialized.");
  }
  
  return sidebar;
};
```

## Usage Patterns

### 1. Safe Usage (Recommended)
```typescript
import { useAuthSafe } from '@/hooks/useAuthSafe';
import { useSidebarSafe } from '@/hooks/useSidebarSafe';

const MyComponent = () => {
  // These will throw errors if contexts are not available
  const { user, isAuthenticated } = useAuthSafe();
  const { isExpanded, toggleSidebar } = useSidebarSafe();
  
  // Safe to use context data here
  return (
    <div>
      <p>User: {user?.name}</p>
      <p>Sidebar: {isExpanded ? 'Expanded' : 'Collapsed'}</p>
    </div>
  );
};
```

### 2. Graceful Handling
```typescript
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';

const MyComponent = () => {
  const auth = useAuth();
  const sidebar = useSidebar();
  
  // Check availability before using
  if (!auth.contextAvailable || !sidebar.contextAvailable) {
    return <div>Loading contexts...</div>;
  }
  
  // Safe to use context data here
  return (
    <div>
      <p>User: {auth.user?.name}</p>
      <p>Sidebar: {sidebar.isExpanded ? 'Expanded' : 'Collapsed'}</p>
    </div>
  );
};
```

### 3. Conditional Rendering
```typescript
const MyComponent = () => {
  const auth = useAuthSafe();
  const sidebar = useSidebarSafe();
  
  // Since we use safe hooks, we know contexts are available
  // But we can still check for additional safety
  if (!auth.contextAvailable) {
    return <div>Auth context not ready</div>;
  }
  
  return <div>Component content</div>;
};
```

## Benefits

### 1. **Error Prevention**
- Components throw clear errors if contexts are not ready
- Prevents undefined value access
- Better debugging experience

### 2. **Consistent State**
- Ensures context data is always valid when accessed
- Prevents race conditions
- Better user experience

### 3. **Developer Experience**
- Clear error messages when contexts are not available
- Type safety maintained
- Easy to implement

### 4. **Performance**
- No unnecessary re-renders
- Context availability is checked once
- Efficient state management

## Migration Guide

### For Existing Components
1. **Option 1**: Replace `useAuth` with `useAuthSafe` and `useSidebar` with `useSidebarSafe`
2. **Option 2**: Add availability checks using the regular hooks

### Example Migration
```typescript
// Before
const { user } = useAuth();
const { isExpanded } = useSidebar();

// After (Option 1 - Recommended)
const { user } = useAuthSafe();
const { isExpanded } = useSidebarSafe();

// After (Option 2 - Manual check)
const auth = useAuth();
const sidebar = useSidebar();
if (!auth.contextAvailable || !sidebar.contextAvailable) {
  return <div>Loading...</div>;
}
const { user } = auth;
const { isExpanded } = sidebar;
```

## Best Practices

### 1. **Use Safe Hooks**
- Always use `useAuthSafe` and `useSidebarSafe` for new components
- This ensures contexts are available before use

### 2. **Error Boundaries**
- Wrap components using context in error boundaries
- Handle context availability errors gracefully

### 3. **Loading States**
- Show loading states while contexts are initializing
- Use the `contextAvailable` property to determine when to show content

### 4. **Testing**
- Test components with contexts not available
- Mock the `contextAvailable` property in tests

## Context Initialization Timeline

### AuthContext
1. Component mounts
2. `loading: true`, `contextAvailable: false`
3. Initialize from localStorage
4. Fetch user profile/privileges if needed
5. `loading: false`, `contextAvailable: true`

### SidebarContext
1. Component mounts
2. `contextAvailable: false`
3. Initialize resize handler
4. `contextAvailable: true` (immediately after mount)

## Conclusion
The `contextAvailable` property provides a robust way to ensure context data is ready before consumption, preventing runtime errors and improving the overall developer and user experience.
