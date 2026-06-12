import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Mahesh Calendar",
  title: "Mahesh Calendar",
  description: "Book a meeting with Mahesh",
  appleWebApp: {
    capable: true,
    title: "Mahesh Calendar",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#247889"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
