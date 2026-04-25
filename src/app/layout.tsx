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
  const primaryColor = config?.primaryColor || '#d4af37';
  const secondaryColor = config?.secondaryColor || '#111111';
  const fontFamily = config?.fontFamily || 'Inter';

  return (
    <html lang="pt-br" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <title>{config?.titulo || 'RODEIO PRO'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={`https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@400;700;900&display=swap`} rel="stylesheet" />
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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
