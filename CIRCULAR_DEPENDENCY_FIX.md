# Circular Dependency Fix

## Issue

Console error when using services:
```
Error: Cannot access '__WEBPACK_DEFAULT_EXPORT__' before initialization
```

This occurred in `customerService.ts` and other services when trying to use `superAxios`.

## Root Cause

**Circular dependency chain:**
```
customerService.ts
    ↓ imports
superAxios.ts
    ↓ imports
authStateHelper.ts
    ↓ imports (at top level)
@/store (Redux store)
    ↓ may import
services or slices that import services
    ↓
Creates circular dependency
```

The issue was that `authStateHelper.ts` was importing the Redux store at the **top level** of the module:

```typescript
// ❌ BAD - Top level import causes circular dependency
import { store } from '@/store';
```

When webpack tries to initialize modules, it gets stuck in a loop because:
1. Services need `superAxios`
2. `superAxios` needs `authStateHelper`
3. `authStateHelper` needs `store`
4. Store initialization may trigger services
5. Loop back to step 1 → Circular dependency!

## Solution

Changed `authStateHelper.ts` to use **lazy loading** for the Redux store:

```typescript
// ✅ GOOD - Lazy getter to avoid circular dependency
function getStore() {
  if (typeof window === 'undefined') return null;
  
  try {
    // Dynamically import store only when needed
    const storeModule = require('@/store');
    return storeModule.store || null;
  } catch (error) {
    return null;
  }
}

// Now use getStore() in functions instead of direct store access
export function getCurrentUser(): User | null {
  const store = getStore(); // Lazy load
  if (store) {
    // ... use store
  }
  // ... fallback to localStorage
}
```

## Changes Made

### File: `src/utils/authStateHelper.ts`

**Before:**
```typescript
import { User } from '@/store/slices/authSlice';
import { store } from '@/store'; // ❌ Circular dependency

export function getCurrentUser(): User | null {
  if (store) {
    const state = store.getState();
    // ...
  }
}
```

**After:**
```typescript
import { User } from '@/store/slices/authSlice';
// ✅ No top-level store import

function getStore() {
  if (typeof window === 'undefined') return null;
  try {
    const storeModule = require('@/store');
    return storeModule.store || null;
  } catch (error) {
    return null;
  }
}

export function getCurrentUser(): User | null {
  const store = getStore(); // ✅ Lazy load
  if (store) {
    const state = store.getState();
    // ...
  }
}
```

### Functions Updated

All functions that accessed the store were updated to use `getStore()`:
- ✅ `getCurrentUser()`
- ✅ `isAuthenticated()`
- ✅ `getAccessToken()`
- ✅ `debugAuthState()`

## Why This Works

### Top-level Import (Circular Dependency)
```
Module Initialization Time:
1. authStateHelper.ts starts loading
2. Imports store from @/store
3. @/store starts loading
4. Store may trigger service imports
5. Service imports superAxios
6. superAxios imports authStateHelper
7. ❌ ERROR: authStateHelper not initialized yet!
```

### Lazy Loading (No Circular Dependency)
```
Module Initialization Time:
1. authStateHelper.ts loads (no store import)
2. superAxios imports authStateHelper ✅
3. Services import superAxios ✅
4. Store loads ✅
5. All modules initialized successfully

Function Execution Time (later):
1. Service calls function in authStateHelper
2. Function calls getStore()
3. Dynamically loads store with require()
4. ✅ Store is already initialized, no circular issue!
```

## Benefits

1. ✅ **No Circular Dependencies** - Store loaded only when needed
2. ✅ **Same Functionality** - All helper functions work identically
3. ✅ **Graceful Fallback** - If store isn't available, falls back to localStorage
4. ✅ **No Performance Impact** - `require()` is cached after first call
5. ✅ **Safe** - Handles errors if store isn't available

## Testing

### Before Fix
```
❌ Console Error:
Error: Cannot access '__WEBPACK_DEFAULT_EXPORT__' before initialization
```

### After Fix
```
✅ No errors
✅ Services work correctly
✅ Auth state helper works
✅ Fallback system works
```

## Related Issues

This pattern should be used whenever:
- A utility needs to access Redux store
- The utility is imported by services
- Services might be imported during store initialization

### Good Pattern (Lazy Loading)
```typescript
function getStore() {
  const storeModule = require('@/store');
  return storeModule.store;
}

export function myHelper() {
  const store = getStore(); // Lazy
  // ... use store
}
```

### Bad Pattern (Top-level Import)
```typescript
import { store } from '@/store'; // ❌ Can cause circular dependency

export function myHelper() {
  store.getState(); // Store imported at module init time
}
```

## Verification

Run the application and verify:
- [x] No console errors about circular dependencies
- [x] Services can use `superAxios` without errors
- [x] Auth state helper functions work correctly
- [x] Redux state is accessible when available
- [x] Fallback to localStorage works

## Files Modified

- ✅ `src/utils/authStateHelper.ts` - Lazy store loading

## Status

✅ **Fixed** - Circular dependency resolved, services working correctly.

---

**Note**: This is a common pattern when dealing with Redux stores in utilities that might be imported during store initialization. Always prefer lazy loading for store access in utilities.

