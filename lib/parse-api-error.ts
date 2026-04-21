/**
 * Safely extract an error message from a failed API response.
 * Handles JSON { error: "..." }, plain text, and HTML 500 pages.
 */
export async function parseApiError(res: Response, fallback = "Something went wrong. Please try again."): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.message === "string") return data.message;
    return fallback;
  } catch {
    return fallback;
  }
}
