import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "./components/ThemeToggle";
import { CustomerProvider } from "./contexts/CustomerContext";
import { AppProvider } from "./contexts/AppContext";

export const metadata: Metadata = {
  title: "B2B Subscription Portal",
  description: "B2B subscription portal with Stripe integration",
};

/**
 * Root layout component for the application
 * Provides global styles, metadata, dark mode support, and context providers
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = theme === 'dark' || (!theme && prefersDark);
                  
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.backgroundColor = '#111827';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.backgroundColor = '#f9fafb';
                  }
                } catch (e) {
                  console.error('Error setting theme:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <AppProvider>
          <CustomerProvider>
            <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0">
                <a href="/" className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  B2B Subscription Portal
                </a>
              </div>
              <div className="flex items-center space-x-4">
                <a
                  href="/"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Customers
                </a>
                <a
                  href="/customer-create"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  + Customer
                </a>
                <a
                  href="/client-create"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  + Client
                </a>
                <a
                  href="/client-create-batch"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  + Batch
                </a>
                <ThemeToggle />
              </div>
                </div>
              </div>
            </nav>
            <main>{children}</main>
          </CustomerProvider>
        </AppProvider>
      </body>
    </html>
  );
}

