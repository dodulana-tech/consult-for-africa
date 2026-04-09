import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { CADRE_DEFINITIONS, NIGERIAN_STATES } from "@/lib/cadreHealth/cadres";
import { EXAM_GUIDES } from "@/lib/cadreHealth/examData";
import { MIGRATION_COUNTRY_SLUGS } from "@/lib/cadreHealth/migrationData";
import { getAllBlogPosts } from "@/sanity/lib/getBlogPosts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://consultforafrica.com";

  // Static routes
  const staticRoutes = [
    { url: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { url: "/about", priority: 0.9, changeFrequency: "monthly" as const },
    { url: "/services", priority: 0.9, changeFrequency: "monthly" as const },
    { url: "/solutions", priority: 0.9, changeFrequency: "monthly" as const },
    { url: "/careers", priority: 0.8, changeFrequency: "weekly" as const },
    { url: "/careers/apply", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/turnaround", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/insights", priority: 0.7, changeFrequency: "weekly" as const },
    { url: "/agent", priority: 0.6, changeFrequency: "monthly" as const },
    // Service pages
    { url: "/services/clinical-governance", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/services/strategy-growth", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/services/fractional-leadership", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/services/digital-health", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/services/health-systems", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/services/diaspora-expertise", priority: 0.8, changeFrequency: "monthly" as const },
    // Solution pages
    { url: "/solutions/advisory", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/solutions/retainer", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/solutions/secondment", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/solutions/fractional", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/solutions/transformation", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/solutions/transaction", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/solutions/distribution", priority: 0.8, changeFrequency: "monthly" as const },
    // Maarova
    { url: "/maarova", priority: 0.9, changeFrequency: "monthly" as const },
    { url: "/maarova/assessment", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/maarova/recruitment", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/maarova/development", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/maarova/services", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/maarova/intelligence", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/maarova/demo", priority: 0.7, changeFrequency: "monthly" as const },
    // CadreHealth - static pages
    { url: "/oncadre", priority: 0.9, changeFrequency: "weekly" as const },
    { url: "/oncadre/readiness", priority: 0.9, changeFrequency: "weekly" as const },
    { url: "/oncadre/register", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/oncadre/login", priority: 0.5, changeFrequency: "monthly" as const },
    // CadreHealth - SEO content pages
    { url: "/oncadre/hospitals", priority: 0.9, changeFrequency: "weekly" as const },
    { url: "/oncadre/salaries", priority: 0.9, changeFrequency: "weekly" as const },
    { url: "/oncadre/exams", priority: 0.9, changeFrequency: "weekly" as const },
    { url: "/oncadre/migrate", priority: 0.9, changeFrequency: "weekly" as const },
    { url: "/oncadre/jobs", priority: 0.9, changeFrequency: "daily" as const },
    // CadreHealth - salary structure pages
    { url: "/oncadre/salaries/conmess", priority: 0.9, changeFrequency: "monthly" as const },
    { url: "/oncadre/salaries/conhess", priority: 0.9, changeFrequency: "monthly" as const },
    // CadreHealth - comparison & ranking pages
    { url: "/oncadre/hospitals/compare", priority: 0.8, changeFrequency: "weekly" as const },
    { url: "/oncadre/hospitals/best", priority: 0.9, changeFrequency: "weekly" as const },
    // CadreHealth - mentorship
    { url: "/oncadre/mentorship", priority: 0.8, changeFrequency: "weekly" as const },
    { url: "/oncadre/mentorship/mentors", priority: 0.7, changeFrequency: "weekly" as const },
    // CadreHealth - legal pages
    { url: "/oncadre/terms", priority: 0.3, changeFrequency: "monthly" as const },
    { url: "/oncadre/privacy", priority: 0.3, changeFrequency: "monthly" as const },
  ];

  // Dynamic hospital pages (programmatic SEO)
  let hospitalRoutes: MetadataRoute.Sitemap = [];
  try {
    const hospitals = await prisma.cadreFacility.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { totalReviews: "desc" },
    });

    hospitalRoutes = hospitals.map((h) => ({
      url: `${base}/oncadre/hospitals/${h.slug}`,
      lastModified: h.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB unavailable during build - skip dynamic routes
  }

  // Dynamic cadre pages
  const cadreRoutes: MetadataRoute.Sitemap = CADRE_DEFINITIONS.map((c) => ({
    url: `${base}/oncadre/cadre/${c.value.toLowerCase().replace(/_/g, "-")}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Dynamic exam guide pages
  const examRoutes: MetadataRoute.Sitemap = EXAM_GUIDES.map((e) => ({
    url: `${base}/oncadre/exams/${e.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Migration country pathway pages
  const migrationRoutes: MetadataRoute.Sitemap = MIGRATION_COUNTRY_SLUGS.map((slug) => ({
    url: `${base}/oncadre/migrate/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  // State directory pages
  const stateRoutes: MetadataRoute.Sitemap = NIGERIAN_STATES.map((state) => ({
    url: `${base}/oncadre/states/${state.toLowerCase().replace(/\s+/g, "-")}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // State best hospitals pages
  const stateBestRoutes: MetadataRoute.Sitemap = NIGERIAN_STATES.map((state) => ({
    url: `${base}/oncadre/hospitals/best/${state.toLowerCase().replace(/\s+/g, "-")}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Blog / Insights posts (Sanity CMS)
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await getAllBlogPosts();
    blogRoutes = (posts ?? [])
      .filter((p: { slug?: { current?: string } }) => p.slug?.current)
      .map((p: { slug: { current: string }; _updatedAt?: string }) => ({
        url: `${base}/insights/${p.slug.current}`,
        lastModified: p._updatedAt ? new Date(p._updatedAt) : new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
  } catch {
    // Sanity unavailable during build - skip blog routes
  }

  return [
    ...staticRoutes.map(({ url, priority, changeFrequency }) => ({
      url: `${base}${url}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    })),
    ...hospitalRoutes,
    ...cadreRoutes,
    ...examRoutes,
    ...migrationRoutes,
    ...stateRoutes,
    ...stateBestRoutes,
    ...blogRoutes,
  ];
}
