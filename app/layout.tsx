import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interactive Wall Calendar | Beautiful Date Range Selector",
  description:
    "A premium, interactive wall calendar component with date range selection, integrated notes, seasonal themes, and responsive design. Built with Next.js and Framer Motion.",
  keywords: [
    "calendar",
    "wall calendar",
    "date range selector",
    "interactive calendar",
    "react calendar",
    "next.js calendar",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
