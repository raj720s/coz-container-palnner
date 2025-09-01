import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { apiSlice } from './api/apiSlice';


import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import userReducer from './slices/userSlice';
import userInfoReducer from './slices/userInfoSlice';
import roleReducer from './slices/roleSlice';

import customerReducer from './slices/customerSlice';
import containerTypeReducer from './slices/containerTypeSlice';
import containerThresholdReducer from './slices/containerThresholdSlice';
import commonDataReducer from './slices/commonDataSlice';

// Persist config for auth
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['token', 'user', 'isAuthenticated'],
};

// Persist config for UI preferences
const uiPersistConfig = {
  key: 'ui',
  storage,
  whitelist: ['theme', 'sidebarCollapsed', 'language'],
};

// Configure the store
export const store = configureStore({
  reducer: {
    // RTK Query API slice
    [apiSlice.reducerPath]: apiSlice.reducer,
    
    // Feature slices
    auth: persistReducer(authPersistConfig, authReducer),
    ui: persistReducer(uiPersistConfig, uiReducer),
    users: userReducer,
    userInfo: userInfoReducer,
    roles: roleReducer,
    // pols: polReducer, // Removed
    customers: customerReducer,
    containerTypes: containerTypeReducer,
    commonData: commonDataReducer,
    containerThresholds: containerThresholdReducer,
  },
  
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
      // Add timeout to prevent middleware from hanging
      immutableCheck: false,
    }).concat(apiSlice.middleware),
  
  devTools: process.env.NODE_ENV !== 'production',
});

// Setup listeners for RTK Query
setupListeners(store.dispatch);

// console.log(store.getState());
// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export store as default
export default store; 
