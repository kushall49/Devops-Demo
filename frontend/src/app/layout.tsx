import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'SmartCal | Calendar & Task Manager',
  description: 'A full-stack Smart Calendar and Task Manager with CI/CD pipeline and Prometheus monitoring — built for DevOps demonstration.',
  keywords: ['calendar', 'tasks', 'devops', 'prometheus', 'grafana', 'monitoring'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Google Fonts - Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-[#0a0a0f] text-slate-100 antialiased min-h-screen">
        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#0a0a0f' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#0a0a0f' } },
          }}
        />
        {children}
      </body>
    </html>
  );
}
