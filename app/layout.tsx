import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Flint Cellar',
  description: 'Manage your wine collection with ease - track inventory, mark wines as consumed, and add tasting notes.',
  keywords: 'wine, cellar, inventory, management, collection',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-red-900">
          {children}
        </div>
      </body>
    </html>
  );
}
