import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppRootProviders } from "@/providers/root-providers";
import { brandAssets } from "@/lib/public-assets";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-app-inter",
});

export const metadata: Metadata = {
  title: "우때",
  description: "실시간 협업 여행 플래너",
  icons: {
    icon: [
      {
        url: brandAssets.favicon,
        type: "image/png",
        sizes: "1254x1254",
      },
    ],
    apple: brandAssets.favicon,
    shortcut: brandAssets.favicon,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full w-full flex flex-col">
        <AppRootProviders>{children}</AppRootProviders>
      </body>
    </html>
  );
}
