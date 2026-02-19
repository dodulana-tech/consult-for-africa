// sanity.config.ts
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";

import { projectId, dataset, apiVersion } from "./sanity/env";
import { schemaTypes } from "./sanity/schemaTypes";

export default defineConfig({
  name: "default",
  title: "Consult For Africa CMS",

  projectId,
  dataset,
  apiVersion,

  // IMPORTANT: because you're serving Studio at /studio
  basePath: "/studio",

  plugins: [structureTool(), visionTool()],


  schema: {
    types: schemaTypes,
  },
});
