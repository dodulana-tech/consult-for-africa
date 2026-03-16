import { defineType, defineField, defineArrayMember } from "sanity";

export default defineType({
  name: "blogPost",
  title: "Blog Post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "author",
      title: "Author",
      type: "string",
    }),

    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
    }),

    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      description: "Short preview text for listing pages",
    }),

    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
    }),

    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
    }),

    defineField({
      name: "coverImage",
      title: "Cover Image",
      type: "image",
      options: { hotspot: true },
    }),

    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [
        defineArrayMember({ type: "block" }),
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Alt Text",
              type: "string",
            }),
            defineField({
              name: "caption",
              title: "Caption",
              type: "string",
            }),
          ],
        }),
      ],
    }),

    defineField({
      name: "readingTime",
      title: "Reading Time (minutes)",
      type: "number",
    }),

    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      description: "Feature this post on the insights page",
    }),
  ],

  preview: {
    select: {
      title: "title",
      author: "author",
      media: "coverImage",
    },
    prepare({ title, author, media }) {
      return {
        title,
        subtitle: author ? `by ${author}` : "",
        media,
      };
    },
  },
});
