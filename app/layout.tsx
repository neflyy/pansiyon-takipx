import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prof. Dr. Necmettin Erbakan Fen Lisesi - Pansiyon ve Yurt Bilgi Sistemi',
  description: 'Pansiyon ve Yurt Takip Otomasyon Sistemi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-50 antialiased selection:bg-blue-200">
        {children}
      </body>
    </html>
  );
}
