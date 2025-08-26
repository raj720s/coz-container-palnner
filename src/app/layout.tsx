import { Outfit } from 'next/font/google';
import './globals.css';

import { ReduxProvider } from '@/components/providers/ReduxProvider';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { RBACProvider } from '@/providers/RBACProvider';
import { LocalStorageInitializer } from '@/components/providers/LocalStorageInitializer';
import { MessageProvider } from '@/components/ui/MessageBox';

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
            <RBACProvider>
              <ThemeProvider>
                <SidebarProvider>
                  <LocalStorageInitializer />
                  <MessageProvider>
                    {children}
                  </MessageProvider>
                </SidebarProvider>
              </ThemeProvider>
            </RBACProvider>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
