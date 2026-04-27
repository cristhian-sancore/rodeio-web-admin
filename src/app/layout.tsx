import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

import { prisma } from "@/lib/db";
import { getSafeConfig } from "@/lib/config-safe";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getSafeConfig();
  
  const primaryColor = config?.primaryColor || '#d4af37';
  const secondaryColor = config?.secondaryColor || '#111111';
  const fontFamily = (config?.fontFamily || 'Inter').replace(/'/g, "");

  return (
    <html lang="pt-br">
      <head>
        <title>{config?.titulo || 'RODEIO PRO'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={`https://fonts.googleapis.com/css2?family=${fontFamily.replaceAll(' ', '+')}:wght@400;700;900&display=swap`} rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content={primaryColor} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: ${primaryColor};
            --secondary: ${secondaryColor};
            --font-main: "${fontFamily}", sans-serif;
          }
          body { font-family: var(--font-main); }
        `}} />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              for(let registration of registrations) { registration.unregister(); }
            });
          }
        `}} />
      </body>
    </html>
  );
}
