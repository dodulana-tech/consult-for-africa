import { client } from "./client";
import {
  featuredPublicationQuery,
  latestPublicationsQuery,
} from "./queries";

export async function getInsights() {
  const featured = await client.fetch(featuredPublicationQuery);
  const latest = await client.fetch(latestPublicationsQuery);

  return { featured, latest };
}
