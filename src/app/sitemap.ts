import type { MetadataRoute } from "next";

import { PUBLIC_INDEXABLE_ROUTES } from "@/lib/public-site-metadata";
import { PUBLIC_SITE } from "@/lib/public-site";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_INDEXABLE_ROUTES.map((entry) => ({
    url: new URL(entry.path, PUBLIC_SITE.origin).toString(),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
