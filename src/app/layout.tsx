import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Slacky - AI-Powered Postgres Assistant",
  description:
    "A sleek, black-themed Slack-like interface for querying your PostgreSQL database with natural language. Built with Next.js 15, TypeScript, and Framer Motion animations.",
  keywords: [
    "PostgreSQL",
    "AI",
    "Database",
    "Slack",
    "Chat",
    "Natural Language",
    "SQL",
    "Next.js",
    "TypeScript",
  ],
  authors: [{ name: "Slacky Team" }],
  creator: "Slacky",
  publisher: "Slacky",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "Slacky - AI-Powered Postgres Assistant",
    description:
      "Query your PostgreSQL database with natural language in a sleek, animated interface",
    url: "http://localhost:3000",
    siteName: "Slacky",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Slacky - AI-Powered Postgres Assistant",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Slacky - AI-Powered Postgres Assistant",
    description:
      "Query your PostgreSQL database with natural language in a sleek, animated interface",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
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
        {children}
      </body>
    </html>
  );
}
