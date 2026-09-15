import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/studio/",
          "/platform/",
          "/founder/",
          "/login",
          "/reset-password",
          "/oncadre/login",
          "/oncadre/register",
          "/oncadre/portal/",
          "/maarova/login",
          "/maarova/portal/",
          "/maarova/coach/",
          "/partner/",
          "/agent-portal/",
          "/client-portal/",
          // ilé is live for the founders to test but is not launched.
          // Remove this when the waiting list opens publicly.
          "/ile",
        ],
      },
    ],
    sitemap: "https://consultforafrica.com/sitemap.xml",
  };
}
