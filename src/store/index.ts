import { configureStore, combineReducers } from '@reduxjs/toolkit';
// Redux Persist imports - kept for future use but not currently used
// import { 
//   persistStore, 
//   persistReducer,
//   FLUSH,
//   REHYDRATE,
//   PAUSE,
//   PERSIST,
//   PURGE,
//   REGISTER,
// } from 'redux-persist';
// import storage from 'redux-persist/lib/storage';

// Import reducers
import commonDataReducer from './slices/commonDataSlice';

// Persist configuration - kept for future use but currently disabled
// const persistConfig = {
//   key: 'nxt_redux_state',
//   storage,
//   whitelist: ['commonData'],
//   timeout: 3000,
// };

// Configure the store without persistence
export const store = configureStore({
  reducer: combineReducers({
    commonData: commonDataReducer,
  }),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Allow all actions since we're not using persistence
        ignoredActions: [],
      },
    }),
});

// Persistor - kept for future use but currently not exported
// export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export store as default
export default store; 
