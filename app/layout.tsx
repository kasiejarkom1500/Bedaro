import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from '@/components/ui/toaster'
import './globals.css' 

export const metadata: Metadata = {
  title: 'BEDARO - BPS Kabupaten Bungo',
  description: 'Bedah Data dan Ragam Informasi - Badan Pusat Statistik Kabupaten Bungo',
  generator: 'By kevinramadha',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
