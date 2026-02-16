import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "UhuyShop - Belanja Online Terpercaya",
  description: "Platform e-commerce terpercaya dengan produk berkualitas dan harga terbaik. Belanja mudah, aman, dan nyaman hanya di UhuyShop.",
  keywords: "ecommerce, belanja online, uhuyshop, toko online, produk murah",
  openGraph: {
    title: "UhuyShop - Belanja Online Terpercaya",
    description: "Platform e-commerce terpercaya dengan produk berkualitas dan harga terbaik.",
    siteName: "UhuyShop",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="font-sans antialiased bg-gray-50 text-gray-900 min-h-screen flex flex-col">
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '16px',
                background: '#1a1a2e',
                color: '#fff',
                fontSize: '14px',
                padding: '12px 20px',
              },
              success: {
                iconTheme: { primary: '#a78bfa', secondary: '#fff' },
              },
            }}
          />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
