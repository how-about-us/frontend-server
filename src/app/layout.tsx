import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppRootProviders } from "@/providers/root-providers";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-app-inter",
});

export const metadata: Metadata = {
  title: "우때",
  description: "실시간 협업 여행 플래너",
  icons: {
    icon: "/우때.svg",
    apple: "/우때.svg",
    shortcut: "/우때.svg",
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
        {process.env.NODE_ENV === "production" && GA_MEASUREMENT_ID ? (
          <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
        ) : null}
      </body>
    </html>
  );
}
