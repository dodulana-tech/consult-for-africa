import { client } from "./client";
import {
  allBlogPostsQuery,
  blogPostBySlugQuery,
  featuredBlogPostsQuery,
  relatedBlogPostsQuery,
  allPublicationsQuery,
  publicationBySlugQuery,
  insightsPageQuery,
} from "./queries";

/* ── Blog Posts ── */

export async function getAllBlogPosts() {
  return client.fetch(allBlogPostsQuery);
}

export async function getBlogPostBySlug(slug: string) {
  return client.fetch(blogPostBySlugQuery, { slug });
}

export async function getFeaturedBlogPosts() {
  return client.fetch(featuredBlogPostsQuery);
}

export async function getRelatedBlogPosts(categoryRef: string, currentId: string) {
  return client.fetch(relatedBlogPostsQuery, { categoryRef, currentId });
}

/* ── Publications ── */

export async function getAllPublications() {
  return client.fetch(allPublicationsQuery);
}

export async function getPublicationBySlug(slug: string) {
  return client.fetch(publicationBySlugQuery, { slug });
}

/* ── Combined Insights Page ── */

export async function getInsightsPage() {
  return client.fetch(insightsPageQuery);
}
