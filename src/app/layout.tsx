import { Outfit } from 'next/font/google';
import './globals.css';

import { ReduxProvider } from '@/components/providers/ReduxProvider';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { MessageProvider } from '@/components/ui/MessageBox';
import UnifiedAuthGuard from '@/components/auth/UnifiedAuthGuard';


const outfit = Outfit({
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        
        <ReduxProvider>
          <AuthProvider>
            <ThemeProvider>
              <SidebarProvider>
                <MessageProvider>
                  <UnifiedAuthGuard>
                    {children}
                  </UnifiedAuthGuard>
                </MessageProvider>
              </SidebarProvider>
            </ThemeProvider>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}