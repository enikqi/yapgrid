import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/components/auth/auth-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YapGrid - Social Media Content Discovery",
  description: "Discover and share the best content from Reddit communities",
  keywords: ["reddit", "social media", "content", "discovery", "community"],
  authors: [{ name: "YapGrid" }],
  creator: "YapGrid",
  publisher: "YapGrid",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "YapGrid",
    description: "Discover and share the best content from Reddit communities",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.svg", sizes: "16x16", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
    other: [
      { rel: "icon", url: "/android-chrome-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { rel: "icon", url: "/android-chrome-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
