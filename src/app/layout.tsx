import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
export const metadata: Metadata = {
  title: {
    template: '%s | Hospital HRM System',
    default: 'Hospital HRM System',
  },
  description: 'Human Resource Management System for Hospital',
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
