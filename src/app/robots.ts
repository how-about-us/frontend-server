import type { MetadataRoute } from "next";

import { PUBLIC_ROBOT_DISALLOW_PATHS } from "@/lib/public-site-metadata";
import { PUBLIC_SITE } from "@/lib/public-site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PUBLIC_ROBOT_DISALLOW_PATHS],
    },
    sitemap: `${PUBLIC_SITE.origin}/sitemap.xml`,
    host: PUBLIC_SITE.origin,
  };
}
