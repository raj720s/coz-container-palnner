# AuthGuard Usage Examples

The consolidated AuthGuard component replaces UserRouteGuard and AdminRouteGuard with a single, flexible component.

## Basic Usage

### 1. Public Route (No Authentication Required)
```tsx
<AuthGuard requireAuth={false}>
  <PublicComponent />
</AuthGuard>
```

### 2. Authenticated Route (Any User)
```tsx
<AuthGuard requireAuth={true}>
  <AuthenticatedComponent />
</AuthGuard>
```

### 3. Admin Only Route
```tsx
<AuthGuard requireAdmin={true}>
  <AdminComponent />
</AuthGuard>
```

### 4. User Only Route (Non-Admin)
```tsx
<AuthGuard requireUser={true}>
  <UserComponent />
</AuthGuard>
```

### 5. Custom Redirect
```tsx
<AuthGuard 
  requireAuth={true} 
  redirectTo="/custom-login"
>
  <Component />
</AuthGuard>
```

### 6. Without Layout (Just Guard Logic)
```tsx
<AuthGuard 
  requireAuth={true} 
  showLayout={false}
>
  <Component />
</AuthGuard>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | Content to render |
| `requireAuth` | `boolean` | `true` | Whether authentication is required |
| `requireAdmin` | `boolean` | `false` | Whether admin role is required |
| `requireUser` | `boolean` | `false` | Whether user role (non-admin) is required |
| `redirectTo` | `string` | - | Custom redirect path |
| `showLayout` | `boolean` | `true` | Whether to show the full layout |

## Migration from Old Guards

### UserRouteGuard → AuthGuard
```tsx
// Old
<UserRouteGuard>
  {children}
</UserRouteGuard>

// New
<AuthGuard requireUser={true}>
  {children}
</AuthGuard>
```

### AdminRouteGuard → AuthGuard
```tsx
// Old
<AdminRouteGuard>
  {children}
</AdminRouteGuard>

// New
<AuthGuard requireAdmin={true}>
  {children}
</AuthGuard>
```

## Features

- **Consolidated Logic**: Single component handles all authentication and authorization
- **Flexible Configuration**: Multiple props for different access requirements
- **Layout Control**: Option to show/hide the full layout
- **Automatic Redirects**: Smart redirects based on user role and requirements
- **Loading States**: Proper loading indicators during authentication checks
- **Session Management**: Automatic session cleanup on logout
