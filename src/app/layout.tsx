import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppRootProviders } from "@/providers/root-providers";
import { brandAssets } from "@/lib/public-assets";
import { PUBLIC_SITE } from "@/lib/public-site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-app-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE.origin),
  title: "우때",
  description: "실시간 협업 여행 플래너",
  icons: {
    icon: [
      {
        url: brandAssets.favicon,
        type: "image/svg+xml",
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
    <html lang="ko" className={`${inter.variable} h-full`}>
      <head>
        <script
          {...{
            nowprocket: "",
            "data-noptimize": "1",
            "data-cfasync": "false",
            "data-wpfc-render": "false",
            "seraph-accel-crit": "1",
            "data-no-defer": "1",
          }}
          dangerouslySetInnerHTML={{
            __html: `(function () {
  var script = document.createElement("script");
  script.async = 1;
  script.src = 'https://emrldtp.com/NTU0ODU1.js?t=554855';
  document.head.appendChild(script);
})();`,
          }}
        />
      </head>
      <body className="min-h-full w-full flex flex-col">
        <AppRootProviders>{children}</AppRootProviders>
      </body>
    </html>
  );
}
