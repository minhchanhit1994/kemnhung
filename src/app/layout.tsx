import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quà tặng kẽm nhung",
  description: "Quà tặng kẽm nhung - Trang sức handmade tinh xảo, mỗi sản phẩm là một tác phẩm nghệ thuật được chế tác tỉ mỉ bằng tay.",
  keywords: ["Quà tặng kẽm nhung", "trang sức", "handmade", "jewelry", "trang sức handmade", "phụ kiện", "đồ handmade"],
  authors: [{ name: "Kẽm Nhung" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Quà tặng kẽm nhung",
    description: "Trang sức handmade tinh xảo, mỗi sản phẩm là một tác phẩm nghệ thuật được chế tác tỉ mỉ bằng tay.",
    url: "https://kemnhung.vercel.app",
    siteName: "Quà tặng kẽm nhung",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quà tặng kẽm nhung",
    description: "Trang sức handmade tinh xảo, mỗi sản phẩm là một tác phẩm nghệ thuật được chế tác tỉ mỉ bằng tay.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
