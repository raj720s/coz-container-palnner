import { configureStore, combineReducers } from '@reduxjs/toolkit';
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

// Import reducers
import userReducer from './slices/consolidatedUserSlice';
import uiReducer from './slices/uiSlice';
import userInfoReducer from './slices/userInfoSlice';
import roleReducer from './slices/roleSlice';
import commonDataReducer from './slices/commonDataSlice';

// Persist config for user (consolidated auth + profile)
const userPersistConfig = {
  key: 'user',
  storage,
  whitelist: ['user', 'token', 'refreshToken', 'isAuthenticated']
};

// Persist config for UI
const uiPersistConfig = {
  key: 'ui',
  storage,
  whitelist: ['theme', 'sidebarCollapsed', 'language']
};

// Configure the store
export const store = configureStore({
  reducer: {
    // Essential slices only
    user: persistReducer(userPersistConfig, userReducer) as any,
    ui: persistReducer(uiPersistConfig, uiReducer) as any,
    userInfo: userInfoReducer,
    roles: roleReducer,
    commonData: commonDataReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export store as default
export default store; 
