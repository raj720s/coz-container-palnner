# Redux Toolkit State Management Guide

This guide covers the complete Redux Toolkit setup with RTK Query for state management and API handling in your Next.js app.

## 🏗️ Architecture Overview

```
src/store/
├── index.ts              # Store configuration
├── hooks.ts              # Typed Redux hooks
├── api/
│   └── apiSlice.ts       # RTK Query API slice
├── slices/
│   ├── authSlice.ts      # Authentication state
│   ├── uiSlice.ts        # UI/Theme state
│   ├── userSlice.ts      # User management state
│   └── roleSlice.ts      # Role management state
└── thunks/
    └── authThunks.ts     # Complex auth operations
```

## 🚀 Quick Start

### 1. Import Hooks
```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useGetUsersQuery, useCreateUserMutation } from '@/store/api/apiSlice';
```

### 2. Use RTK Query for API Calls
```typescript
function UsersList() {
  // Automatic caching, loading states, and refetching
  const { data: users, isLoading, error } = useGetUsersQuery({
    page: 1,
    limit: 20
  });
  
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {users?.data.map(user => (
        <div key={user.id}>{user.first_name} {user.last_name}</div>
      ))}
    </div>
  );
}
```

### 3. Use Redux State
```typescript
function ThemeToggle() {
  const dispatch = useAppDispatch();
  const { theme, isDarkMode } = useAppSelector(state => state.ui);
  
  const handleToggle = () => {
    dispatch(toggleDarkMode());
  };
  
  return <button onClick={handleToggle}>Toggle Theme</button>;
}
```

## 📊 State Slices

### Auth Slice (`authSlice.ts`)
Manages user authentication state.

**State:**
- `user`: Current user object
- `token`: JWT token
- `isAuthenticated`: Authentication status
- `isLoading`: Loading state
- `error`: Error messages

**Actions:**
```typescript
import { loginSuccess, logout, updateProfile } from '@/store/slices/authSlice';

// Login user
dispatch(loginSuccess({ user, token, refreshToken }));

// Logout user
dispatch(logout());

// Update profile
dispatch(updateProfile({ first_name: 'John' }));
```

**Selectors:**
```typescript
const user = useAppSelector(selectUser);
const isAuthenticated = useAppSelector(selectIsAuthenticated);
const authLoading = useAppSelector(selectAuthLoading);
```

### UI Slice (`uiSlice.ts`)
Manages global UI state including theme, sidebar, notifications.

**State:**
- `theme`: Current theme ('light' | 'dark' | 'system')
- `sidebarCollapsed`: Sidebar state
- `notifications`: App notifications
- `modals`: Modal states
- `language`: Current language

**Actions:**
```typescript
import { 
  setTheme, 
  toggleSidebar, 
  addNotification, 
  openModal 
} from '@/store/slices/uiSlice';

// Change theme
dispatch(setTheme('dark'));

// Toggle sidebar
dispatch(toggleSidebar());

// Add notification
dispatch(addNotification({
  type: 'success',
  title: 'Success!',
  message: 'Operation completed'
}));

// Open modal
dispatch(openModal({ modalId: 'userForm', data: userData }));
```

### User Slice (`userSlice.ts`)
Manages user list state, filtering, pagination, selection.

**State:**
- `users`: Current user list
- `selectedUsers`: Selected user IDs
- `filters`: Applied filters
- `currentPage`: Current page number
- `searchQuery`: Search text

**Actions:**
```typescript
import { 
  selectUser, 
  setSearchQuery, 
  setCurrentPage 
} from '@/store/slices/userSlice';

// Select user for bulk operations
dispatch(selectUser(userId));

// Update search
dispatch(setSearchQuery('john doe'));

// Change page
dispatch(setCurrentPage(2));
```

### Role Slice (`roleSlice.ts`)
Similar to user slice but for role management.

## 🌐 RTK Query API Slice

### Automatic Features
- **Caching**: Responses are cached automatically
- **Loading States**: Built-in loading indicators
- **Error Handling**: Consistent error management
- **Refetching**: Smart data refetching
- **Optimistic Updates**: UI updates before API response

### User Management Endpoints

```typescript
// Get users with automatic caching
const { data, isLoading, error, refetch } = useGetUsersQuery({
  page: 1,
  limit: 20,
  search: 'john'
});

// Create user with optimistic updates
const [createUser, { isLoading: creating }] = useCreateUserMutation();

const handleCreate = async (userData) => {
  try {
    const result = await createUser(userData).unwrap();
    // Success handling
  } catch (error) {
    // Error handling
  }
};

// Other available hooks:
useGetUserQuery(userId)
useUpdateUserMutation()
useDeleteUserMutation()
useBulkUpdateUserStatusMutation()
```

### Role Management Endpoints

```typescript
// Get roles
const { data: roles } = useGetRolesQuery({ limit: 50 });

// Get privileges (cached globally)
const { data: privileges } = useGetPrivilegesQuery();

// Mutations
const [createRole] = useCreateRoleMutation();
const [updateRole] = useUpdateRoleMutation();
const [deleteRole] = useDeleteRoleMutation();
const [assignPrivileges] = useAssignPrivilegesToRoleMutation();
```

## 🔄 Complex Operations with Thunks

For operations requiring multiple API calls or complex logic:

```typescript
import { loginUser, logoutUser, verifyToken } from '@/store/thunks/authThunks';

// Login with automatic token storage
dispatch(loginUser({ 
  email: 'user@example.com', 
  password: 'password',
  rememberMe: true 
}));

// Logout with cleanup
dispatch(logoutUser());

// Verify token on app start
dispatch(verifyToken());
```

## 🎣 Custom Hooks

Convenient hooks for common use cases:

```typescript
import { 
  useAuth, 
  useTheme, 
  useSidebar, 
  useNotifications,
  useUsers,
  useRoles 
} from '@/store/hooks';

function MyComponent() {
  // Auth
  const { user, isAuthenticated } = useAuth();
  
  // Theme
  const { theme, isDarkMode } = useTheme();
  
  // Sidebar
  const { sidebarCollapsed, sidebarOpen } = useSidebar();
  
  // Notifications
  const { notifications, unreadCount } = useNotifications();
  
  // Users state
  const { users, selectedUsers, searchQuery } = useUsers();
  
  // Roles state
  const { roles, privileges } = useRoles();
}
```

## 🔄 Cache Management

RTK Query provides automatic cache management with tags:

```typescript
// Cache is automatically invalidated when related data changes
const { data: users } = useGetUsersQuery();

// Manual cache invalidation
import { apiSlice } from '@/store/api/apiSlice';

// Invalidate all user data
dispatch(apiSlice.util.invalidateTags(['User']));

// Invalidate specific user
dispatch(apiSlice.util.invalidateTags([{ type: 'User', id: userId }]));
```

## 📝 Best Practices

### 1. Use RTK Query for API Calls
```typescript
// ✅ Good: Use RTK Query hooks
const { data: users, isLoading } = useGetUsersQuery();

// ❌ Avoid: Manual API calls with useState
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(false);
```

### 2. Use Selectors for Derived State
```typescript
// ✅ Good: Use selectors
const unreadNotifications = useAppSelector(selectUnreadNotifications);

// ❌ Avoid: Computing in component
const unreadNotifications = notifications.filter(n => !n.read);
```

### 3. Batch Related Actions
```typescript
// ✅ Good: Use action creators that handle multiple updates
dispatch(setUsers({ users, total, page, totalPages }));

// ❌ Avoid: Multiple separate dispatches
dispatch(setUsersList(users));
dispatch(setTotalUsers(total));
dispatch(setCurrentPage(page));
```

### 4. Use TypeScript
```typescript
// ✅ Good: Typed hooks
const users = useAppSelector((state: RootState) => state.users.users);

// ✅ Better: Use custom typed hooks
const users = useUsers();
```

## 🔧 Configuration

### Environment Variables
```env
# API Base URL
BASEURL=https://api.example.com
# or
NEXT_PUBLIC_BASE_URL=https://api.example.com
```

### Store Configuration
The store is configured with:
- **Persistence**: Auth and UI state persisted to localStorage
- **DevTools**: Enabled in development
- **Middleware**: RTK Query + Redux Persist
- **Serialization**: Configured for Redux Persist

## 🧪 Testing

### Testing Components with Redux
```typescript
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';

const mockStore = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    users: userReducer,
    roles: roleReducer,
  },
});

const renderWithRedux = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      {component}
    </Provider>
  );
};
```

### Mocking RTK Query
```typescript
import { apiSlice } from '@/store/api/apiSlice';

// Mock successful response
apiSlice.endpoints.getUsers.initiate = jest.fn().mockReturnValue({
  unwrap: () => Promise.resolve({ data: mockUsers, total: 10 })
});
```

## 🚀 Migration from Existing Context

To migrate from existing React Context:

1. **Replace Context imports**:
```typescript
// ❌ Old
import { useAuth } from '@/context/AuthContext';

// ✅ New
import { useAuth } from '@/store/hooks';
```

2. **Replace direct API calls**:
```typescript
// ❌ Old
import { userService } from '@/services';
const users = await userService.getUsers();

// ✅ New
const { data: users } = useGetUsersQuery();
```

3. **Replace state management**:
```typescript
// ❌ Old
const [theme, setTheme] = useState('light');

// ✅ New
const { theme } = useTheme();
const dispatch = useAppDispatch();
dispatch(setTheme('dark'));
```

## 📈 Performance Benefits

- **Automatic Caching**: Reduces unnecessary API calls
- **Optimistic Updates**: Instant UI feedback
- **Background Refetching**: Keeps data fresh
- **Selective Re-renders**: Components only re-render when relevant data changes
- **DevTools**: Excellent debugging experience

## 🔗 Useful Links

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [RTK Query Documentation](https://redux-toolkit.js.org/rtk-query/overview)
- [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools)
