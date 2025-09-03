
import './globals.css';
import * as React from 'react';
import { Toaster, ToasterProvider } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme-provider';

// This is the new root layout that wraps all pages
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
       <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
        >
            <ToasterProvider>
                {children}
                <Toaster />
            </ToasterProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
