"use client";

import { useEffect } from 'react';
import { localStorageService } from '@/utils/localStorageService';

export function LocalStorageInitializer() {
  useEffect(() => {
    // Force clear ALL localStorage data to ensure fresh initialization
    if (typeof window !== 'undefined') {
      console.log('🔄 FORCE CLEARING ALL localStorage data for fresh initialization');
      
      // Clear all localStorage keys that start with 'nxt_admin_'
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('nxt_admin_')) {
          console.log(`🗑️ Removing: ${key}`);
          localStorage.removeItem(key);
        }
      });
      
      // Also clear any other potential keys
      const additionalKeys = [
        'nxt_admin_pol_ports',
        'nxt_admin_pod_ports', 
        'nxt_admin_container_priorities',
        'nxt_admin_container_thresholds',
        'nxt_admin_uploaded_files',
        'nxt_admin_shipment_data',
        'nxt_admin_container_planning_results',
        'nxt_admin_file_counter'
      ];
      
      additionalKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          console.log(`🗑️ Force removing: ${key}`);
          localStorage.removeItem(key);
        }
      });
      
      // Wait a bit to ensure clearing is complete
      setTimeout(() => {
        console.log('⏳ Clearing complete, now initializing...');
        
        // Initialize localStorage service with default data
        localStorageService.init();
        
        console.log('✅ LocalStorage service initialized with default data');
        
        // Log what was initialized
        const polPorts = localStorageService.getPOLPorts();
        const podPorts = localStorageService.getPODPorts();
        const priorities = localStorageService.getContainerPriorities();
        const thresholds = localStorageService.getContainerThresholds();
        
        console.log('📊 Initialized data:', {
          polPorts: polPorts.length,
          podPorts: podPorts.length,
          priorities: priorities.length,
          thresholds: thresholds.length
        });
        
        console.log('🏗️ Available POL ports:', polPorts.map(p => p.name).join(', '));
        console.log('🏗️ Available container types:', priorities.map(p => p.containerType).join(', '));
        
        // Verify the data is correct
        if (polPorts.length !== 6) {
          console.error('❌ Expected 6 POL ports, got:', polPorts.length);
          console.error('❌ This means the initialization failed!');
        } else {
          console.log('✅ SUCCESS: All 6 POL ports are now available!');
        }
        
        if (priorities.length !== 3) {
          console.error('❌ Expected 3 container priorities, got:', priorities.length);
        } else {
          console.log('✅ SUCCESS: All 3 container priorities are now available!');
        }
        
        // Double-check by reading directly from localStorage
        const rawPolPorts = localStorage.getItem('nxt_admin_pol_ports');
        console.log('🔍 Raw localStorage POL ports:', rawPolPorts);
        
      }, 100);
    }
  }, []);

  return null; // This component doesn't render anything
}
