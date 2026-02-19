import { client } from "./client";
import { publicationsQuery } from "./queries";

export async function getPublications() {
  return client.fetch(publicationsQuery);
}
