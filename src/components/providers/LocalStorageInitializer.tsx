"use client";

import { useEffect, useRef } from 'react';
import { localStorageService } from '@/utils/localStorageService';

export function LocalStorageInitializer() {
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only run once to prevent conflicts with Redux Persist
    if (hasInitialized.current || typeof window === 'undefined') {
      return;
    }

    try {
      hasInitialized.current = true;

      // Check if we need to initialize (only if data doesn't exist)
      const polPorts = localStorage.getItem('nxt_admin_pol_ports');
      const podPorts = localStorage.getItem('nxt_admin_pod_ports');
      const priorities = localStorage.getItem('nxt_admin_container_priorities');
      const thresholds = localStorage.getItem('nxt_admin_container_thresholds');

      // Only clear and reinitialize if the data is missing or corrupted
      if (!polPorts || !podPorts || !priorities || !thresholds) {
        console.log('🔄 Some localStorage data is missing, initializing...');
        
        // Clear only the specific keys that need reinitialization
        const keysToClear = [
          'nxt_admin_pol_ports',
          'nxt_admin_pod_ports', 
          'nxt_admin_container_priorities',
          'nxt_admin_container_thresholds',
          'nxt_admin_uploaded_files',
          'nxt_admin_shipment_data',
          'nxt_admin_container_planning_results',
          'nxt_admin_file_counter'
        ];
        
        keysToClear.forEach(key => {
          if (localStorage.getItem(key)) {
            console.log(`🗑️ Removing: ${key}`);
            localStorage.removeItem(key);
          }
        });
        
        // Initialize localStorage service with default data
        localStorageService.init();
        
        console.log('✅ LocalStorage service initialized with default data');
        
        // Log what was initialized
        const newPolPorts = localStorageService.getPOLPorts();
        const newPodPorts = localStorageService.getPODPorts();
        const newPriorities = localStorageService.getContainerPriorities();
        const newThresholds = localStorageService.getContainerThresholds();
        
        console.log('📊 Initialized data:', {
          polPorts: newPolPorts.length,
          podPorts: newPodPorts.length,
          priorities: newPriorities.length,
          thresholds: newThresholds.length
        });
      } else {
        console.log('✅ LocalStorage data already exists, skipping initialization');
      }
    } catch (error) {
      console.error('❌ Error during localStorage initialization:', error);
      // Don't let initialization errors break the app
    }
  }, []);

  return null; // This component doesn't render anything
}
