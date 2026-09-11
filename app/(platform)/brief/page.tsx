import { redirect } from "next/navigation";

/**
 * The principal's brief was a second screen answering "what is the state of the
 * firm", and it duplicated five of its nine categories from the desk. Its two
 * genuine differences, opening somebody else's view and carrying firm-level
 * facts, are now features of /desk rather than a separate page. Kept as a
 * redirect so existing links and bookmarks still land somewhere useful.
 */
export default function BriefPage() {
  redirect("/desk");
}
