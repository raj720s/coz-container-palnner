import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col  dark:bg-gray-900 sm:p-0">
          {children}
          <div className="lg:w-1/2 w-full h-full bg-gradient-to-br from-theme-purple-900 via-theme-purple-800 to-theme-purple-950 dark:from-theme-purple-900/20 dark:via-theme-purple-800/10 dark:to-theme-purple-950/20 lg:grid items-center hidden relative overflow-hidden">
            {/* Logistics-themed background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white/20 rounded-full"></div>
              <div className="absolute top-32 right-16 w-24 h-24 border-2 border-white/20 rounded-full"></div>
              <div className="absolute bottom-20 left-20 w-40 h-40 border-2 border-white/20 rounded-full"></div>
              <div className="absolute bottom-32 right-32 w-16 h-16 border-2 border-white/20 rounded-full"></div>
              
              {/* Logistics icons */}
              <div className="absolute top-1/4 left-1/4 w-8 h-8 text-white/30">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="absolute top-1/3 right-1/3 w-6 h-6 text-white/30">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="absolute bottom-1/4 left-1/3 w-10 h-10 text-white/30">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 7h-8v6h8V7zm-2 4h-4V9h4v2zm4-12H3C1.9 1 1 1.9 1 3v18c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H3V5h18v14z" />
                </svg>
              </div>
            </div>
            
            <div className="relative items-center justify-center flex z-10">
              <div className="flex flex-col items-center max-w-md text-center px-8">
                
                  <h1 className="text-5xl font-bold mb-4">   
                    <span className="text-theme-purple-300 dark:text-theme-purple-200">Vendor </span>
                    <span className="text-white dark:text-gray-100">Booking Tool</span>
                  </h1>
           
            
              </div>
            </div>
          </div>
          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
