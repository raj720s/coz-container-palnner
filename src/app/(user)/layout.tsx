"use client";

import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { LocalStorageInitializer } from "@/components/providers/LocalStorageInitializer";
import { MessageProvider } from "@/components/ui/MessageBox";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SidebarProvider>
          <MessageProvider>
            <AuthGuard requireUser={true}>
              {children}
            </AuthGuard>
          </MessageProvider>
        </SidebarProvider>
      </ThemeProvider>
    </AuthProvider>
  );
} 