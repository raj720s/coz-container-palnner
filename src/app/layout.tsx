import { Outfit } from 'next/font/google';
import './globals.css';

import { ReduxProvider } from '@/components/providers/ReduxProvider';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { LocalStorageInitializer } from '@/components/providers/LocalStorageInitializer';
import { MessageProvider } from '@/components/ui/MessageBox';
import { AuthGuard } from '@/components/auth/AuthGuard';

const outfit = Outfit({
  subsets: ["latin"],
});

// Simple loading debug component
function LoadingDebug() {
  if (typeof window !== 'undefined') {
    console.log('🔍 Layout: Component mounted, checking providers...');
  }
  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <LoadingDebug />
        <ReduxProvider>
          <LocalStorageInitializer />
          <AuthProvider>
            <ThemeProvider>
              <SidebarProvider>
                <MessageProvider>
                  <AuthGuard requireAuth={false}>
                    {children}
                  </AuthGuard>
                </MessageProvider>
              </SidebarProvider>
            </ThemeProvider>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
