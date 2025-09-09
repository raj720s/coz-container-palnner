"use client";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { LocalStorageInitializer } from "@/components/providers/LocalStorageInitializer";
import { MessageProvider } from "@/components/ui/MessageBox";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SidebarProvider>
          <MessageProvider>
            <AuthGuard requireAdmin={true}>
              {children}
            </AuthGuard>
          </MessageProvider>
        </SidebarProvider>
      </ThemeProvider>
    </AuthProvider>
  );
} 