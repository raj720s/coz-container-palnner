"use client";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { RBACProvider } from "@/providers/RBACProvider";
import { LocalStorageInitializer } from "@/components/providers/LocalStorageInitializer";
import { MessageProvider } from "@/components/ui/MessageBox";
import { AdminRouteGuard } from "@/components/auth/AdminRouteGuard";

export default function AdminLayout({
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
              <AdminRouteGuard>
                {children}
              </AdminRouteGuard>
            </MessageProvider>
          </SidebarProvider>
        </ThemeProvider>
      </RBACProvider>
    </AuthProvider>
  );
} 