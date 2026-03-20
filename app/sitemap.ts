import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://consultforafrica.com";

  const routes = [
    { url: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { url: "/about", priority: 0.9, changeFrequency: "monthly" as const },
    { url: "/services", priority: 0.9, changeFrequency: "monthly" as const },
    { url: "/careers", priority: 0.8, changeFrequency: "weekly" as const },
    { url: "/careers/apply", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/turnaround", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/insights", priority: 0.7, changeFrequency: "weekly" as const },
    { url: "/maarova", priority: 0.9, changeFrequency: "monthly" as const },
    { url: "/maarova/assessment", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/maarova/recruitment", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/maarova/development", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/maarova/services", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/maarova/intelligence", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/maarova/demo", priority: 0.7, changeFrequency: "monthly" as const },
  ];

  return routes.map(({ url, priority, changeFrequency }) => ({
    url: `${base}${url}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
