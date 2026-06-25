'use client';
import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import NativeBridge from '@/components/NativeBridge';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const darkMode = useAuthStore(s => s.user?.darkMode);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return (
    <html><body><div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div></body></html>
  );

  return (
    <html lang="en" className={darkMode ? 'dark' : ''}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#4338ca" />
        <meta name="description" content="Yaar Mohammad Tola - Official Village Digital Platform" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <title>Yaar Mohammad Tola</title>
      </head>
      <body className="font-sans antialiased">
        <QueryClientProvider client={queryClient}>
          <NativeBridge />
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: { background: '#1e1b4b', color: '#fff', borderRadius: '12px', fontSize: '14px' },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </QueryClientProvider>
      </body>
    </html>
  );
}
