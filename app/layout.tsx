import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'eKonsulta | PhilHealth Outpatient EMR Portal',
  description: 'PhilHealth YAKAP Outpatient EMR — Eligibility Check, GAMOT Formulary, and Electronic Prescription System for accredited clinics.',
  keywords: 'PhilHealth, YAKAP, GAMOT, outpatient, EMR, prescription, eKonsulta',
  authors: [{ name: 'PhilHealth NCR' }],
  robots: 'noindex,nofollow',
};

import Providers from '@/components/Providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} h-full bg-gray-50`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            richColors
            expand
            toastOptions={{
              style: { fontFamily: 'Inter, sans-serif' },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
