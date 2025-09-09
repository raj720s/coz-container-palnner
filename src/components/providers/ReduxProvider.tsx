"use client";

import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';

interface ReduxProviderProps {
  children: React.ReactNode;
}

// Loading component for PersistGate
const PersistLoading = () => {
  useEffect(() => {
    console.log('🔄 Redux Persist: Showing loading screen...');
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading application state...</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">This may take a few seconds</p>
        <p className="text-xs text-gray-400 mt-2">Redux Persist is rehydrating...</p>
      </div>
    </div>
  );
};

// Fallback component if PersistGate gets stuck
const FallbackComponent = ({ children }: { children: React.ReactNode }) => {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    console.log('⏰ Fallback: Starting 10-second timer...');
    
    // If PersistGate takes longer than 10 seconds, show fallback
    const timer = setTimeout(() => {
      console.warn('⚠️ Redux Persist took too long, showing fallback');
      setShowFallback(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  if (showFallback) {
    console.warn('⚠️ Redux Persist took too long, showing fallback');
    return <>{children}</>;
  }

  return <PersistLoading />;
};

export function ReduxProvider({ children }: ReduxProviderProps) {
  useEffect(() => {
    console.log('🔍 ReduxProvider: Component mounted');
    
    // Check initial store state
    const initialState = store.getState();
    console.log('🔍 ReduxProvider: Initial store state:', {
      user: {
        isAuthenticated: initialState.user.isAuthenticated,
        user: initialState.user.user ? 'User exists' : 'No user',
        token: initialState.user.token ? 'Token exists' : 'No token'
      }
    });
  }, []);

  return (
    <Provider store={store}>
      <PersistGate 
        loading={<FallbackComponent>{children}</FallbackComponent>} 
        persistor={persistor}
        onBeforeLift={() => {
          console.log('🔄 Redux Persist: Starting to rehydrate store...');
        }}
        onAfterLift={() => {
          console.log('✅ Redux Persist: Store rehydration complete');
          
          // Check final store state
          const finalState = store.getState();
          console.log('✅ ReduxProvider: Final store state after rehydration:', {
            user: {
              isAuthenticated: finalState.user.isAuthenticated,
              user: finalState.user.user ? 'User exists' : 'No user',
              token: finalState.user.token ? 'Token exists' : 'No token'
            }
          });
        }}
      >
        {children}
      </PersistGate>
    </Provider>
  );
}
