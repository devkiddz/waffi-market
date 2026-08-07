import type { Metadata, Viewport } from 'next';

import type { ReactNode } from 'react';

import './globals.css';
import '@/features/pwa/pwa.css';

import ApplicationShell from '@/components/layout/ApplicationShell';

import { ActionFeedbackProvider } from '@/features/action-feedback';

import { AssistantAccessButton } from '@/features/ai-assistance';

import { GlobalOverlayProvider } from '@/features/global-overlay';

import { CartProvider } from '@/features/cart';

import { CatalogProvider } from '@/features/catalog';

import { PWAGlobalStatus, PWARuntimeProvider } from '@/features/pwa';

import { ShoppingListRuntimeProvider } from '@/features/shopping-lists';

import { WishlistProvider } from '@/features/wishlist';

import { WorkspaceProvider } from '@/features/workspace';

import { cn } from '@/lib/utils';

import IdentityProvider from '@/providers/IdentityProvider';

import SearchProvider from '@/providers/SearchProvider';

import ThemeProvider from '@/providers/ThemeProvider';

export const metadata: Metadata = {
  applicationName: 'Shelsea',

  title: {
    default: 'Shelsea — Fashion, Beauty & Lifestyle',

    template: '%s · Shelsea'
  },

  description: 'Discover clothing, accessories, hair, fragrances and curated style at Shelsea.',

  manifest: '/manifest.webmanifest',

  appleWebApp: {
    capable: true,

    statusBarStyle: 'black-translucent',

    title: 'Shelsea'
  },

  icons: {
    icon: '/favicon.ico',

    apple: '/pwa/apple-touch-icon.png'
  },

  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: 'device-width',

  initialScale: 1,

  viewportFit: 'cover',

  themeColor: [
    {
      media: '(prefers-color-scheme: light)',

      color: '#fbf7ef'
    },
    {
      media: '(prefers-color-scheme: dark)',

      color: '#050814'
    }
  ]
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning className={cn('h-full', 'font-sans antialiased')}>
      <body className="app-ui-normalized min-h-svh bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <IdentityProvider>
            <ActionFeedbackProvider>
              <PWARuntimeProvider>
                <WorkspaceProvider>
                  <GlobalOverlayProvider>
                    <ShoppingListRuntimeProvider>
                      <CatalogProvider>
                        <WishlistProvider>
                          <CartProvider>
                            <SearchProvider>
                              <ApplicationShell>{children}</ApplicationShell>

                              <PWAGlobalStatus />

                              <AssistantAccessButton />
                            </SearchProvider>
                          </CartProvider>
                        </WishlistProvider>
                      </CatalogProvider>
                    </ShoppingListRuntimeProvider>
                  </GlobalOverlayProvider>
                </WorkspaceProvider>
              </PWARuntimeProvider>
            </ActionFeedbackProvider>
          </IdentityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
