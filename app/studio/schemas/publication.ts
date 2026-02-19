import { defineType, defineField } from "sanity";

export default defineType({
  name: "publication",
  title: "Publication",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: Rule => Rule.required(),
    }),

    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title" },
    }),

    defineField({
      name: "summary",
      type: "text",
    }),

    defineField({
      name: "category",
      type: "string",
      options: {
        list: [
          "Finance & Performance",
          "Health Systems",
          "Governance",
          "Capital Projects",
        ],
      },
    }),

    defineField({
      name: "featured",
      type: "boolean",
      description: "Mark as featured whitepaper",
    }),

    defineField({
      name: "featuredImage",
      type: "image",
    }),
    
     defineField({
      name: "coverImage",
      title: "Cover Image",
      type: "image",
      options: { hotspot: true },
    }),

    defineField({
      name: "file",
      type: "file",
      title: "PDF File",
    }),
  ],
});
