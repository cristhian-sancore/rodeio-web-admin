import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

import { prisma } from "@/lib/db";

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
  let config = null;
  try {
    config = await prisma.configuracao.findFirst();
  } catch (err) {
    // Falha silenciosa durante o build (prerender)
  }
  const primaryColor = '#d4af37';
  const secondaryColor = '#111111';
  const fontFamily = config?.fontFamily || 'Inter';

  return (
    <html lang="pt-br" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <title>{config?.titulo || 'RODEIO PRO'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={`https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@400;700;900&display=swap`} rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content={primaryColor} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: ${primaryColor};
            --secondary: ${secondaryColor};
            --font-main: '${fontFamily}', sans-serif;
          }
          body {
            font-family: var(--font-main);
          }
        `}} />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').then(function(registration) {
                console.log('SW registrado com sucesso: ', registration.scope);
              }, function(err) {
                console.log('Falha no registro do SW: ', err);
              });
            });
          }
        `}} />
      </body>
    </html>
  );
}
