# Enhanced useCommonData Hooks

This document explains how to use the enhanced `useCommonData` hooks for managing multiple common data API responses with Redux state management.

## Overview

The enhanced hooks provide:
- **DRY Principle**: Reusable logic for common data fetching
- **Optimization**: Memoized functions and optimized re-renders
- **Type Safety**: Full TypeScript support
- **Flexibility**: Support for single and multiple data sources
- **Authentication**: Automatic integration with `superAxios` for auth headers

## Available Hooks

### 1. `useCommonData` (Single Data Source)

Basic hook for managing a single data source.

```tsx
import { useCommonData } from '@/hooks/useCommonData';

const MyComponent = () => {
  const { data, loading, error, refresh } = useCommonData(
    fetchUserInfo, // thunk action
    selectUserInfo // selector
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>User Info</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
};
```

## Configuration Options

### Data Source Configuration

The `useCommonData` hook accepts:

```tsx
{
  thunkAction: any,              // Redux thunk action creator
  selector: (state) => any,      // State selector function
}
```

### Selector Pattern

The selector should return an object with this structure:

```tsx
{
  data: any,        // The actual data
  loading: boolean, // Loading state
  error: string | null, // Error state
  isInitialized?: boolean, // Optional: whether data has been initialized
  lastFetched?: number, // Optional: timestamp of last fetch
}
```

## Integration with Redux Store

### 1. Add Reducer to Store

```tsx
// store/index.ts
import userInfoReducer from './slices/userInfoSlice';

export const store = configureStore({
  reducer: {
    // ... other reducers
    userInfo: userInfoReducer,
  },
});
```

### 2. Use the Hook

```tsx
import { useCommonData } from '@/hooks/useCommonData';
import { fetchUserInfo, selectUserInfo } from '@/store/slices/userInfoSlice';

const MyComponent = () => {
  const { data, loading, error, refresh } = useCommonData(fetchUserInfo, selectUserInfo);
  
  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {data && <div>User: {data.first_name}</div>}
      <button onClick={refresh}>Refresh</button>
    </div>
  );
};
```

## Best Practices

### 1. Error Handling

```tsx
const MyComponent = () => {
  const { data, loading, error, refresh } = useCommonData(/* ... */);

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  // ... rest of component
};
```

### 2. Loading States

```tsx
const MyComponent = () => {
  const { data, loading, error } = useCommonData(fetchUserInfo, selectUserInfo);

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // ... render with data
};
```

### 3. Conditional Fetching

```tsx
const MyComponent = () => {
  const { data, loading, error, refresh } = useCommonData(
    { type: 'userInfo/fetchUserInfo' },
    (state) => state.userInfo
  );

  // Only fetch if user is authenticated
  useEffect(() => {
    if (isAuthenticated && !data) {
      refresh();
    }
  }, [isAuthenticated, data, refresh]);

  // ... rest of component
};
```

### 4. Optimizing Re-renders

```tsx
const MyComponent = () => {
  const { data, refresh } = useCommonData(/* ... */);

  // Memoize expensive computations
  const processedData = useMemo(() => {
    return data ? processData(data) : null;
  }, [data]);

  // Memoize callbacks
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  // ... rest of component
};
```

## Authentication Integration

The hooks automatically work with `superAxios` which includes:

- **Automatic Auth Headers**: Uses the token from environment variables
- **Base URL Configuration**: Configured in `@/config/variables`
- **Request/Response Interceptors**: For language handling and error management

```tsx
// superAxios automatically includes:
headers: {
  'Content-Type': 'application/json',
  'Authorization': `${process.env.NEXT_PUBLIC_TOKEN}`
}
```

## Adding New Data Sources

### 1. Create a New Slice

```tsx
// store/slices/newDataSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import superAxios from '@/utils/superAxios';

export const fetchNewData = createAsyncThunk(
  'newData/fetchNewData',
  async () => {
    const response = await superAxios.get('/api/new-data');
    return response.data;
  }
);

const newDataSlice = createSlice({
  name: 'newData',
  initialState: { data: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNewData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNewData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchNewData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default newDataSlice.reducer;
```

### 2. Add to Store

```tsx
// store/index.ts
import newDataReducer from './slices/newDataSlice';

export const store = configureStore({
  reducer: {
    // ... other reducers
    newData: newDataReducer,
  },
});
```

### 3. Use in Hook

```tsx
const MyComponent = () => {
  const { data, loading, error } = useMultipleCommonData({
    userInfo: { /* ... */ },
    newData: {
      thunk: { type: 'newData/fetchNewData' },
      selector: (state) => ({
        data: state.newData.data,
        loading: state.newData.loading,
        error: state.newData.error,
      }),
      autoFetch: true,
    },
  });

  // ... rest of component
};
```

## Troubleshooting

### Common Issues

1. **TypeScript Errors**: Ensure selectors return the expected structure
2. **Infinite Loops**: Check dependencies in useEffect hooks
3. **Missing Data**: Verify that thunk actions are properly dispatched
4. **Authentication Errors**: Check that `NEXT_PUBLIC_TOKEN` is set

### Debug Mode

Enable debug logging by setting:

```tsx
// In your component
const { data, loading, error } = useCommonData(/* ... */);

console.log('Data State:', { data, loading, error });
```

## Performance Considerations

- **Memoization**: Use `useMemo` for expensive computations
- **Callback Optimization**: Use `useCallback` for event handlers
- **Selective Updates**: Only select the state you need
- **Refresh Control**: Use the `refresh` function to manually update data when needed

This enhanced hook system provides a robust, type-safe, and optimized way to manage multiple common data sources in your Redux application while following DRY principles and best practices.
