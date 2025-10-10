# Redux Authentication Integration

## Overview

The authentication system has been refactored to use **Redux as the primary state management** with **localStorage as a fallback mechanism**. This provides better state management, persistence, and scalability.

## Key Changes

### 1. Redux State Management

#### Auth Slice (`src/store/slices/authSlice.ts`)

- **Purpose**: Centralized authentication state management
- **Key Name**: `auth_user` (used for Redux persist)
- **State Structure**:
  ```typescript
  {
    user: User | null,
    token: string | null,
    isAuthenticated: boolean,
    isInitialized: boolean,
    contextAvailable: boolean,
    loading: {
      auth: boolean,
      profile: boolean,
      privileges: boolean
    },
    errors: {
      auth: string | null,
      profile: string | null,
      privileges: string | null
    }
  }
  ```

#### Redux Actions

- **Async Thunks**:
  - `loginUser` - Handles user login with API calls
  - `fetchUserProfile` - Refreshes user profile data
  - `fetchUserPrivileges` - Fetches and updates user privileges/RBAC data

- **Synchronous Actions**:
  - `setLoading` - Update loading states
  - `setError` - Set error messages
  - `setAuthSuccess` - Set authenticated user and token
  - `setUser` - Update user data
  - `updateUserPartial` - Partial user updates
  - `logout` - Clear authentication state
  - `setInitialized` - Mark auth as initialized
  - `setContextAvailable` - Mark context as available
  - `assignCustomersToUser` - Add customers to user
  - `removeCustomersFromUser` - Remove customers from user

### 2. Redux Persistence

#### Configuration (`src/store/index.ts`)

```typescript
const authPersistConfig = {
  key: 'auth_user',  // Key name in localStorage
  storage,
  whitelist: ['user', 'token', 'isAuthenticated', 'isInitialized'],
  timeout: 3000,
};
```

- Uses `redux-persist` to automatically persist auth state
- State is saved to localStorage with key `persist:auth_user`
- Only essential fields are persisted (whitelist)

#### PersistGate Integration (`src/components/providers/ReduxProvider.tsx`)

- Wraps the app with `PersistGate`
- Shows loading screen while rehydrating state
- Ensures Redux state is restored before app renders

### 3. AuthContext Integration

#### Updated Flow (`src/context/AuthContext.tsx`)

The AuthContext now acts as a **bridge** between Redux and the rest of the application:

1. **Uses Redux hooks** to access state:
   ```typescript
   const dispatch = useAppDispatch();
   const user = useAppSelector(selectUser);
   const token = useAppSelector(selectToken);
   ```

2. **Dispatches Redux actions** for state changes:
   ```typescript
   dispatch(loginUser({ email, password }));
   dispatch(logoutAction());
   dispatch(fetchUserPrivileges({ roleId, user }));
   ```

3. **Maintains localStorage as fallback**:
   - Uses `auth_user_fallback` key in localStorage
   - Syncs critical data to localStorage after Redux updates
   - Falls back to localStorage if Redux state is empty during initialization

### 4. Initialization Flow

```
App Start
    ↓
Redux State Rehydration (PersistGate)
    ↓
AuthContext Initialization
    ↓
Check Redux State (Primary)
    ├─ If exists: Use Redux state
    │   └─ Fetch privileges if incomplete
    │
    └─ If empty: Check localStorage (Fallback)
        └─ If exists: Restore to Redux
            └─ Fetch privileges if incomplete
```

### 5. Login Flow

```
User Login
    ↓
Dispatch loginUser() thunk
    ↓
API Call: Get tokens
    ↓
API Call: Get user profile
    ↓
Redux State Updated
    ↓
localStorage Fallback Updated
    ↓
Dispatch fetchUserPrivileges() (background)
    ↓
Redux State Updated with RBAC data
    ↓
localStorage Fallback Synced
```

## Usage Examples

### Accessing Auth State

#### In Components (via Context)

```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, can, canAccessModule } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please login</div>;
  }
  
  return (
    <div>
      <h1>Welcome {user?.name}</h1>
      {can('create_shipment') && <CreateButton />}
      {canAccessModule(5) && <AdminPanel />}
    </div>
  );
}
```

#### Direct Redux Access (if needed)

```typescript
import { useAppSelector } from '@/store/hooks';
import { selectUser, selectIsAuthenticated } from '@/store/slices/authSlice';

function MyComponent() {
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  // Use state directly
}
```

### Dispatching Actions

#### Login

```typescript
const { login } = useAuth();

const handleLogin = async () => {
  const result = await login(email, password);
  if (result.success) {
    // Redirect or show success
  } else {
    // Show error
    console.error(result.error);
  }
};
```

#### Logout

```typescript
const { logout } = useAuth();

const handleLogout = () => {
  logout();
  // Redirect to login page
};
```

#### Refresh Profile

```typescript
const { refreshUserProfile, refreshUserPrivileges } = useAuth();

// Refresh user profile
await refreshUserProfile();

// Refresh privileges
await refreshUserPrivileges();
```

#### Update Customer Assignments

```typescript
const { assignCustomersToUser, removeCustomersFromUser } = useAuth();

// Assign customers
assignCustomersToUser([1, 2, 3]);

// Remove customers
removeCustomersFromUser([2, 3]);
```

## Benefits

### 1. **Better State Management**
- Centralized state in Redux
- Predictable state updates
- Better debugging with Redux DevTools

### 2. **Automatic Persistence**
- Redux Persist handles state persistence automatically
- No manual localStorage management needed
- State survives page refreshes

### 3. **Fallback Mechanism**
- localStorage serves as emergency fallback
- Graceful degradation if Redux fails
- Backward compatibility

### 4. **Better Testing**
- Redux state can be easily mocked
- Actions can be tested independently
- Better separation of concerns

### 5. **Scalability**
- Easy to add new auth-related state
- Middleware support for advanced features
- Better integration with other Redux state

## Migration Notes

### For Developers

1. **No Breaking Changes**: The AuthContext API remains the same
2. **State Location**: Auth state is now in Redux (`state.auth`)
3. **Persistence Key**: Changed from `auth_user` to `persist:auth_user` (Redux) and `auth_user_fallback` (localStorage)
4. **New Selectors**: Use Redux selectors for direct state access if needed

### For Testing

```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/slices/authSlice';

// Create mock store for testing
const mockStore = configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState: {
    auth: {
      user: mockUser,
      token: 'mock-token',
      isAuthenticated: true,
      // ...
    },
  },
});
```

## Troubleshooting

### Issue: State not persisting

**Solution**: Check Redux DevTools for `persist/REHYDRATE` action. Ensure `PersistGate` is properly wrapping the app.

### Issue: Infinite initialization loop

**Solution**: Check that `initializationRef.current` is being set correctly in AuthContext.

### Issue: localStorage not syncing

**Solution**: Verify that `StorageManager.saveUser()` is called after Redux state updates in critical flows.

### Issue: Redux state empty after refresh

**Solution**: 
1. Check browser console for persistence errors
2. Verify `redux-persist` configuration
3. Check that storage is not blocked (private browsing)

## Future Enhancements

1. **Token Refresh in Redux**: Move token refresh logic to Redux middleware
2. **Offline Support**: Use Redux Persist with IndexedDB for larger data
3. **State Encryption**: Encrypt sensitive data in localStorage
4. **Multi-tab Sync**: Sync auth state across browser tabs
5. **Session Management**: Add session timeout handling in Redux

## Technical Details

### Storage Keys

- **Redux Persist**: `persist:auth_user`
- **localStorage Fallback**: `auth_user_fallback`
- **Token**: `auth_token`
- **Refresh Token**: `refresh_token`

### Redux Middleware

```typescript
middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
    },
  })
```

### TypeScript Types

All types are centralized in `src/store/slices/authSlice.ts`:
- `User`
- `UserRole`
- `AuthState`

These types are re-exported from AuthContext for backward compatibility.

## Related Files

- `src/store/slices/authSlice.ts` - Redux auth slice
- `src/store/index.ts` - Redux store configuration
- `src/store/hooks.ts` - Typed Redux hooks
- `src/context/AuthContext.tsx` - Auth context provider
- `src/components/providers/ReduxProvider.tsx` - Redux provider with persistence
- `src/app/layout.tsx` - Root layout with providers

## Support

For questions or issues, refer to:
- Redux Toolkit Docs: https://redux-toolkit.js.org/
- Redux Persist Docs: https://github.com/rt2zz/redux-persist
- Project-specific docs in `/src/docs/`

