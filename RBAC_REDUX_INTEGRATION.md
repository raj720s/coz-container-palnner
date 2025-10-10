# RBAC Redux Integration

## Overview

All RBAC (Role-Based Access Control) architecture and components have been updated to use Redux as the primary state source with localStorage as a fallback. This ensures consistent state management across the application.

## Key Changes

### 1. Created Auth State Helper (`src/utils/authStateHelper.ts`)

A comprehensive utility that provides safe access to authentication state from Redux (primary) with localStorage fallback.

#### Features

- **Multi-layer fallback system:**
  1. Redux store (primary)
  2. Redux persist data from localStorage
  3. Manual fallback user data from localStorage

- **Helper functions:**
  ```typescript
  // Get user data
  getCurrentUser(): User | null
  getCurrentUserRoleId(): number | null
  getCurrentUserId(): string | null
  getCurrentUserEmail(): string | null
  
  // Check permissions
  isCurrentUserSuperUser(): boolean
  isCurrentUserAdmin(): boolean
  hasPrivilege(privilege: string): boolean
  canAccessModule(moduleId: number): boolean
  
  // Get RBAC data
  getCurrentUserPrivileges(): string[]
  getCurrentUserModules(): number[]
  getCurrentUserRoutes(): string[]
  getCurrentUserCustomers(): number[]
  
  // Check auth status
  isAuthenticated(): boolean
  isMockUser(): boolean
  
  // Get tokens
  getAccessToken(): string | null
  getRefreshToken(): string | null
  
  // Debug
  debugAuthState(): void
  ```

### 2. Updated Services

#### `simplifiedRBACService.ts`

**Changes:**
- Imports auth state helper functions
- `getAuthToken()` - Now uses `getAuthAccessToken()` from helper
- `getCurrentUserRoleId()` - Now uses helper function
- `isMockUser()` - Now uses helper function

**Benefits:**
- Automatic fallback to localStorage if Redux state is unavailable
- Consistent with Redux state management
- No direct localStorage access for user data

#### `superAxios.ts`

**Changes:**
- Imports `getAccessToken` and `AUTH_STORAGE_KEYS` from helper
- Request interceptor uses `getAccessToken()` for token
- Refresh error handler uses proper storage keys for cleanup

**Benefits:**
- Tokens retrieved from Redux store first, then fallback to localStorage
- Proper cleanup of all storage locations on auth failure
- Consistent key naming across the app

#### `tokenAutoRefreshService.ts`

**Changes:**
- Updated to clear user from all storage locations:
  - `auth_user_fallback` (manual fallback)
  - `persist:auth_user` (Redux persist)

**Benefits:**
- Complete cleanup on token refresh failure
- No stale user data in any storage location

### 3. RBAC Components (Already Using Redux)

All RBAC components were already using `useAuth()` hook, which now internally uses Redux:

#### ✅ `ConditionalRender.tsx`
```typescript
const { can, canAccessModule, canAccessAnyModule, hasAnyRole, isSuperUser, loading } = useAuth();
```

#### ✅ `SimplifiedRBACComponents.tsx`
```typescript
const { can, canAccessModule, canAccessAnyModule, hasAnyRole, isSuperUser, loading } = useAuth();
```

#### ✅ `withSimplifiedRBAC.tsx`
```typescript
const rbacContext = useAuth();
const { user, loading, error, can, canVisit, canAccessModule, canAccessAnyModule, hasRole, hasAnyRole, isAdmin } = rbacContext;
```

#### ✅ `UnifiedAuthGuard.tsx`
```typescript
const auth = useAuth();
// Uses auth.isAuthenticated, auth.user, auth.contextAvailable, auth.canAccessRoute
```

#### ✅ `AppSidebar.tsx`
```typescript
const { user, canAccessModule } = useAuth();
```

**No changes needed** - These components automatically benefit from Redux integration through `useAuth()`.

## Storage Architecture

### Storage Keys

| Key | Purpose | Type | Management |
|-----|---------|------|------------|
| `persist:auth_user` | Redux persist data | Auto | Redux Persist |
| `auth_user_fallback` | Fallback user data | Manual | AuthContext |
| `auth_token` | Access token | Manual | authService |
| `refresh_token` | Refresh token | Manual | authService |

### State Flow

```
Component uses useAuth()
    ↓
AuthContext (uses Redux hooks)
    ↓
Redux Store (Primary)
    ↓
If not available, falls back to:
    ↓
authStateHelper checks:
  1. Redux store
  2. Redux persist (persist:auth_user)
  3. Fallback localStorage (auth_user_fallback)
```

### Service Flow

```
Service needs user data
    ↓
Use authStateHelper functions
    ↓
Helper checks (in order):
  1. Redux store state
  2. Redux persist localStorage
  3. Fallback localStorage
    ↓
Returns user data or null
```

## Migration Impact

### ✅ No Breaking Changes

All existing code continues to work without modifications:

```typescript
// In Components
const { user, can, canAccessModule } = useAuth();
if (can('CREATE_SHIPMENT')) { /* ... */ }

// In Services (new pattern)
import { getCurrentUser, hasPrivilege } from '@/utils/authStateHelper';
const user = getCurrentUser();
if (hasPrivilege('CREATE_SHIPMENT')) { /* ... */ }
```

### ✅ Improved Reliability

- **Components**: Already using `useAuth()` → automatically get Redux benefits
- **Services**: Now use helper functions → automatic fallback support
- **Network Layer**: superAxios uses helper → consistent token retrieval

## Usage Examples

### In React Components

```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, can, canAccessModule, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <Login />;
  
  return (
    <div>
      <h1>Welcome {user?.name}</h1>
      {can('CREATE_SHIPMENT') && <CreateShipmentButton />}
      {canAccessModule(50) && <AdminPanel />}
    </div>
  );
}
```

### In Services (Outside React)

```typescript
import { 
  getCurrentUser, 
  hasPrivilege, 
  canAccessModule,
  isCurrentUserAdmin 
} from '@/utils/authStateHelper';

class MyService {
  async doSomething() {
    const user = getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    if (!hasPrivilege('CREATE_SHIPMENT')) {
      throw new Error('Insufficient permissions');
    }
    
    // Proceed with operation
  }
  
  async adminOnlyOperation() {
    if (!isCurrentUserAdmin()) {
      throw new Error('Admin access required');
    }
    
    // Proceed with admin operation
  }
}
```

### Debugging Auth State

```typescript
import { debugAuthState } from '@/utils/authStateHelper';

// In browser console or during development
debugAuthState();

// Output:
// 🔐 Auth State Debug
//   Redux State: { user: {...}, token: "...", isAuthenticated: true }
//   Current User: { id: "1", email: "...", ... }
//   Is Authenticated: true
//   User Role ID: 1
//   Is Superuser: true
//   Is Admin: true
//   Has Token: true
```

## Benefits of This Integration

### 1. **Consistency**
- All auth state flows through Redux
- Single source of truth for authentication
- Predictable state updates

### 2. **Reliability**
- Multi-layer fallback system
- Graceful degradation if one layer fails
- Automatic recovery from storage issues

### 3. **Developer Experience**
- Type-safe helper functions
- Clear API for common operations
- Better debugging with Redux DevTools

### 4. **Performance**
- Reduced localStorage reads
- Redux state cached in memory
- Efficient state updates

### 5. **Maintainability**
- Centralized auth logic
- Easy to extend with new features
- Clear separation of concerns

## Testing

### Test Checklist

- ✅ Login flow stores data in Redux and localStorage
- ✅ Page refresh restores state from Redux persist
- ✅ RBAC checks work correctly (can, canAccessModule, etc.)
- ✅ Services can access user state via helper
- ✅ Fallback works if Redux state is cleared
- ✅ Token refresh updates all storage locations
- ✅ Logout clears all storage locations
- ✅ UnifiedAuthGuard properly gates routes
- ✅ Sidebar shows/hides based on permissions
- ✅ ConditionalRender works with Redux state

### Manual Testing Steps

1. **Login and Check State**
   ```
   - Login with valid credentials
   - Open Redux DevTools → Check auth state
   - Open Application tab → Check localStorage
   - Verify: persist:auth_user exists
   - Verify: auth_user_fallback exists
   - Verify: auth_token exists
   ```

2. **Test RBAC**
   ```
   - Navigate to various routes
   - Check sidebar visibility based on permissions
   - Try accessing restricted routes
   - Verify: Access denied for unauthorized routes
   - Verify: Components using ConditionalRender show/hide correctly
   ```

3. **Test Fallback**
   ```
   - In Application tab, delete persist:auth_user
   - Refresh page
   - Verify: State restored from auth_user_fallback
   - Verify: User remains logged in
   - Verify: RBAC checks still work
   ```

4. **Test Token Refresh**
   ```
   - Wait for auto token refresh (or trigger manually)
   - Verify: New token stored in all locations
   - Verify: User state remains intact
   - Verify: No logout or errors
   ```

5. **Test Logout**
   ```
   - Click logout
   - Verify: Redux state cleared
   - Verify: persist:auth_user cleared
   - Verify: auth_user_fallback cleared
   - Verify: Tokens cleared
   - Verify: Redirected to signin
   ```

## Troubleshooting

### Issue: User state not available in service

**Solution**: Use auth state helper
```typescript
import { getCurrentUser } from '@/utils/authStateHelper';
const user = getCurrentUser();
```

### Issue: RBAC checks not working

**Solution**: Ensure component uses `useAuth()` hook
```typescript
const { can, canAccessModule } = useAuth();
```

### Issue: State lost after page refresh

**Solution**: Check Redux persist configuration
```typescript
// In src/store/index.ts
const persistConfig = {
  key: 'auth_user',
  storage,
  whitelist: ['user', 'token', 'isAuthenticated', 'isInitialized'],
};
```

### Issue: Service gets stale user data

**Solution**: Helper always gets fresh data from store
```typescript
// Don't cache user object
const user = getCurrentUser(); // Fresh every time

// Instead of:
const user = getCurrentUser();
// ... later ...
user.role_id // May be stale
```

## Files Modified

### New Files

1. ✅ `src/utils/authStateHelper.ts` - Auth state helper utility
2. ✅ `RBAC_REDUX_INTEGRATION.md` - This documentation

### Updated Files

1. ✅ `src/services/simplifiedRBACService.ts` - Uses auth helper
2. ✅ `src/utils/superAxios.ts` - Uses auth helper for tokens
3. ✅ `src/services/tokenAutoRefreshService.ts` - Clears all storage locations
4. ✅ `src/context/AuthContext.tsx` - Uses Redux (from previous update)
5. ✅ `src/store/slices/authSlice.ts` - Redux auth slice (from previous update)
6. ✅ `src/store/index.ts` - Redux persist config (from previous update)

### No Changes Needed

All RBAC components already use `useAuth()`:
- ✅ `src/components/shared/ConditionalRender.tsx`
- ✅ `src/components/rbac/SimplifiedRBACComponents.tsx`
- ✅ `src/components/auth/withSimplifiedRBAC.tsx`
- ✅ `src/components/auth/UnifiedAuthGuard.tsx`
- ✅ `src/layout/AppSidebar.tsx`

## Future Enhancements

1. **Redux Middleware for RBAC**
   - Intercept actions and check permissions
   - Automatic permission checking for sensitive operations

2. **Cached Permission Checks**
   - Cache permission results for performance
   - Invalidate cache on user/role updates

3. **Real-time Permission Updates**
   - WebSocket integration for live permission changes
   - Update Redux state when permissions change server-side

4. **Enhanced Debug Tools**
   - RBAC inspector component
   - Visual permission tree viewer
   - Route access analyzer

## Related Documentation

- [REDUX_AUTH_INTEGRATION.md](./REDUX_AUTH_INTEGRATION.md) - Redux auth setup
- [REDUX_AUTH_SUMMARY.md](./REDUX_AUTH_SUMMARY.md) - Quick reference
- [ENHANCED_RBAC_ARCHITECTURE.md](./ENHANCED_RBAC_ARCHITECTURE.md) - RBAC architecture

## Support

For questions or issues:
1. Check Redux DevTools for state
2. Use `debugAuthState()` helper
3. Check browser console for errors
4. Refer to this documentation

