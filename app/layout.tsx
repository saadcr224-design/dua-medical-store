import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DUA MEDICAL STORE",
  description: "Medicine inventory, barcode billing and store management.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/dua-favicon-v2.png",
    shortcut: "/dua-favicon-v2.png",
    apple: "/dua-apple-icon-v2.png",
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
