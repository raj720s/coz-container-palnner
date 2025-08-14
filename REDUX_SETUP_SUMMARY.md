# Redux Toolkit Setup Summary

## ✅ What's Been Implemented

### 🏗️ **Core Redux Setup**
- **Redux Store** configured with Redux Toolkit
- **RTK Query** for API state management
- **Redux Persist** for state persistence
- **TypeScript** integration throughout

### 📦 **State Slices Created**
1. **Auth Slice** - User authentication state
2. **UI Slice** - Theme, sidebar, notifications, modals
3. **User Slice** - User management state & filters
4. **Role Slice** - Role management state & filters

### 🌐 **API Integration**
- **Complete RTK Query setup** with all User & Role endpoints
- **Automatic caching** and cache invalidation
- **Loading states** and error handling
- **Optimistic updates** for better UX

### 🎣 **Developer Experience**
- **Typed hooks** for better TypeScript support
- **Custom hooks** for common use cases
- **Redux DevTools** integration
- **Comprehensive documentation**

## 🚀 **How to Use Redux in Your App**

### 1. **Basic API Calls with RTK Query**
```typescript
import { useGetUsersQuery, useCreateUserMutation } from '@/store/api/apiSlice';

function UsersList() {
  // Automatic loading, caching, error handling
  const { data: users, isLoading, error } = useGetUsersQuery({
    page: 1,
    limit: 20,
    search: 'john'
  });
  
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  
  const handleCreate = async (userData) => {
    try {
      await createUser(userData).unwrap();
      // Success! Cache automatically updated
    } catch (error) {
      console.error('Failed:', error);
    }
  };
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {users?.data.map(user => (
        <div key={user.id}>{user.first_name}</div>
      ))}
    </div>
  );
}
```

### 2. **Using Redux State**
```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setTheme, addNotification } from '@/store/slices/uiSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state.ui.theme);
  
  const handleThemeChange = () => {
    dispatch(setTheme('dark'));
    dispatch(addNotification({
      type: 'success',
      title: 'Theme changed',
      message: 'Switched to dark mode'
    }));
  };
  
  return <button onClick={handleThemeChange}>Change Theme</button>;
}
```

### 3. **Using Custom Hooks**
```typescript
import { useAuth, useTheme, useUsers } from '@/store/hooks';

function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();
  const { users, selectedUsers } = useUsers();
  
  if (!isAuthenticated) return <Login />;
  
  return (
    <div className={isDarkMode ? 'dark' : 'light'}>
      <h1>Welcome, {user?.first_name}!</h1>
      <p>Selected users: {selectedUsers.length}</p>
    </div>
  );
}
```

## 📋 **Available API Endpoints**

### **User Management**
```typescript
// Queries (GET requests)
useGetUsersQuery({ page, limit, search, role, organisation })
useGetUserQuery(userId)
useGetUserDetailQuery(userId)
useGetUserShortInfoQuery(userId)

// Mutations (POST/PUT/DELETE requests)
useCreateUserMutation()
useUpdateUserMutation()
useDeleteUserMutation()
useModifySuperuserStatusMutation()
useBulkUpdateUserStatusMutation()
```

### **Role Management**
```typescript
// Queries
useGetRolesQuery({ page, limit, search, is_active })
useGetRoleQuery(roleId)
useGetPrivilegesQuery()
useGetRoleUsersQuery(roleId)
useGetRoleStatisticsQuery()

// Mutations
useCreateRoleMutation()
useUpdateRoleMutation()
useDeleteRoleMutation()
useAssignPrivilegesToRoleMutation()
useRemovePrivilegesFromRoleMutation()
useBulkUpdateRoleStatusMutation()
```

## 🔄 **Migration from Services**

### **Before (Old Service Pattern)**
```typescript
import { userService } from '@/services';

function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await userService.getUsers();
        setUsers(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // Manual state management...
}
```

### **After (Redux + RTK Query)**
```typescript
import { useGetUsersQuery } from '@/store/api/apiSlice';

function UsersList() {
  // Automatic loading, caching, error handling!
  const { data: users, isLoading, error } = useGetUsersQuery();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {users?.data.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

## 🎯 **Key Benefits**

### **1. Automatic Caching**
- API responses cached automatically
- No duplicate requests for same data
- Cache invalidation on mutations

### **2. Better Developer Experience**
- TypeScript support throughout
- Redux DevTools for debugging
- Predictable state updates

### **3. Performance Improvements**
- Optimistic updates
- Background refetching
- Selective re-renders

### **4. Simplified Code**
- Less boilerplate code
- Automatic loading states
- Consistent error handling

## 🔧 **Configuration Files Created**

```
src/store/
├── index.ts                    # Store configuration
├── hooks.ts                    # Typed Redux hooks
├── README.md                   # Comprehensive documentation
├── api/
│   └── apiSlice.ts            # RTK Query API slice
├── slices/
│   ├── authSlice.ts           # Authentication state
│   ├── uiSlice.ts             # UI/Theme state
│   ├── userSlice.ts           # User management state
│   └── roleSlice.ts           # Role management state
├── thunks/
│   └── authThunks.ts          # Complex auth operations
└── components/
    ├── providers/
    │   └── ReduxProvider.tsx  # Redux Provider wrapper
    └── examples/
        └── ReduxUserManagementExample.tsx  # Usage example
```

## 🚀 **Next Steps**

1. **Start using RTK Query hooks** in your components
2. **Migrate from Context** to Redux hooks gradually
3. **Use Redux state** for global app state (theme, auth, etc.)
4. **Leverage caching** to improve performance
5. **Explore advanced features** like optimistic updates

## 🔗 **Quick References**

### **Common Imports**
```typescript
// Hooks
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useAuth, useTheme, useUsers } from '@/store/hooks';

// API
import { useGetUsersQuery, useCreateUserMutation } from '@/store/api/apiSlice';

// Actions
import { loginSuccess, logout } from '@/store/slices/authSlice';
import { setTheme, addNotification } from '@/store/slices/uiSlice';
import { selectUser, setSearchQuery } from '@/store/slices/userSlice';
```

### **Environment Setup**
```env
# Required for API calls
BASEURL=https://your-api-url.com
# or
NEXT_PUBLIC_BASE_URL=https://your-api-url.com
```

Your Redux Toolkit setup is now complete and ready to use! 🎉
