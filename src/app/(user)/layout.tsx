"use client";

import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { RBACProvider } from "@/providers/RBACProvider";
import { LocalStorageInitializer } from "@/components/providers/LocalStorageInitializer";
import { MessageProvider } from "@/components/ui/MessageBox";
import { UserRouteGuard } from "@/components/auth/UserRouteGuard";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <RBACProvider>
        <ThemeProvider>
          <SidebarProvider>
            <MessageProvider>
              <UserRouteGuard>
                {children}
              </UserRouteGuard>
            </MessageProvider>
          </SidebarProvider>
        </ThemeProvider>
      </RBACProvider>
    </AuthProvider>
  );
} 