import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slacky - Discover Amazing Slack Communities",
  description:
    "Find and join the best Slack communities for developers, designers, entrepreneurs, and more.",
  keywords: "slack, communities, developers, designers, networking, chat",
  authors: [{ name: "Slacky Team" }],
  openGraph: {
    title: "Slacky - Discover Amazing Slack Communities",
    description:
      "Find and join the best Slack communities for developers, designers, entrepreneurs, and more.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Slacky - Discover Amazing Slack Communities",
    description:
      "Find and join the best Slack communities for developers, designers, entrepreneurs, and more.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
