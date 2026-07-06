import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Architect Runner MVP",
  description: "Phase 0 foundation for Architect Runner MVP"
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
