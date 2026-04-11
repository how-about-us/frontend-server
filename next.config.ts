import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    // Next가 상위 디렉토리의 lockfile을 루트로 오인하지 않도록 현재 프로젝트로 고정합니다.
    root: process.cwd(),
  },
};

export default nextConfig;
