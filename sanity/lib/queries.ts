export const featuredPublicationQuery = `
*[_type == "publication" && featured == true][0]{
  _id,
  title,
  summary,
  category,
  "imageUrl": featuredImage.asset->url,
  "fileUrl": file.asset->url
}
`;

export const latestPublicationsQuery = `
*[_type == "publication" && featured != true] | order(_createdAt desc)[0...2]{
  _id,
  title,
  category,
  "imageUrl": featuredImage.asset->url
}
`;
