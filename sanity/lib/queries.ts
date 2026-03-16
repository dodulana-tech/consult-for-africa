/* ── Publications ── */

export const featuredPublicationQuery = `
*[_type == "publication" && featured == true][0]{
  _id,
  title,
  slug,
  summary,
  category,
  author,
  publishedAt,
  readingTime,
  tags,
  "imageUrl": featuredImage.asset->url,
  "coverImageUrl": coverImage.asset->url,
  "fileUrl": file.asset->url
}
`;

export const latestPublicationsQuery = `
*[_type == "publication" && featured != true] | order(_createdAt desc)[0...2]{
  _id,
  title,
  slug,
  category,
  summary,
  author,
  publishedAt,
  "imageUrl": featuredImage.asset->url,
  "coverImageUrl": coverImage.asset->url,
  "fileUrl": file.asset->url
}
`;

export const allPublicationsQuery = `
*[_type == "publication"] | order(publishedAt desc, _createdAt desc){
  _id,
  title,
  slug,
  summary,
  category,
  author,
  publishedAt,
  readingTime,
  tags,
  featured,
  "imageUrl": featuredImage.asset->url,
  "coverImageUrl": coverImage.asset->url,
  "fileUrl": file.asset->url
}
`;

export const publicationBySlugQuery = `
*[_type == "publication" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  summary,
  category,
  author,
  publishedAt,
  readingTime,
  tags,
  featured,
  body,
  "imageUrl": featuredImage.asset->url,
  "coverImageUrl": coverImage.asset->url,
  "fileUrl": file.asset->url
}
`;

/* ── Blog Posts ── */

export const allBlogPostsQuery = `
*[_type == "blogPost"] | order(publishedAt desc){
  _id,
  title,
  slug,
  author,
  publishedAt,
  excerpt,
  readingTime,
  tags,
  featured,
  "categoryTitle": category->title,
  "coverImageUrl": coverImage.asset->url
}
`;

export const blogPostBySlugQuery = `
*[_type == "blogPost" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  author,
  publishedAt,
  excerpt,
  readingTime,
  tags,
  featured,
  body,
  "categoryTitle": category->title,
  "coverImageUrl": coverImage.asset->url
}
`;

export const featuredBlogPostsQuery = `
*[_type == "blogPost" && featured == true] | order(publishedAt desc){
  _id,
  title,
  slug,
  author,
  publishedAt,
  excerpt,
  readingTime,
  tags,
  "categoryTitle": category->title,
  "coverImageUrl": coverImage.asset->url
}
`;

export const insightsPageQuery = `{
  "featuredPublication": ${featuredPublicationQuery},
  "allPublications": ${allPublicationsQuery},
  "featuredBlogPosts": ${featuredBlogPostsQuery},
  "recentBlogPosts": *[_type == "blogPost"] | order(publishedAt desc)[0...6]{
    _id,
    title,
    slug,
    author,
    publishedAt,
    excerpt,
    readingTime,
    tags,
    featured,
    "categoryTitle": category->title,
    "coverImageUrl": coverImage.asset->url
  }
}`;

/* ── Related posts (same category, exclude current) ── */

export const relatedBlogPostsQuery = `
*[_type == "blogPost" && category._ref == $categoryRef && _id != $currentId] | order(publishedAt desc)[0...3]{
  _id,
  title,
  slug,
  author,
  publishedAt,
  excerpt,
  readingTime,
  "categoryTitle": category->title,
  "coverImageUrl": coverImage.asset->url
}
`;
