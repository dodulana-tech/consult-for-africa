/**
 * Server-side PDF text extraction for the Node serverless runtime.
 *
 * Why not pdf-parse: pdf-parse v2 loads pdfjs-dist, and pdfjs only gets its
 * DOMMatrix, ImageData and Path2D globals by doing a runtime
 * `createRequire(import.meta.url)("@napi-rs/canvas")`. A bundler cannot see
 * through that call, so on Vercel the native canvas package is never traced
 * into the function and the require fails. pdfjs then warns "Cannot polyfill
 * DOMMatrix" and immediately runs a module-level `new DOMMatrix()`, which
 * throws "DOMMatrix is not defined" before a single byte of the PDF is read.
 * It works on a developer machine only because node_modules is sitting there
 * on disk.
 *
 * unpdf ships a pdfjs build for exactly this environment: no canvas, no native
 * binary, no dynamic require, and its own pure JavaScript DOMMatrix stub
 * installed before pdfjs loads. It has zero dependencies, so the bundler can
 * trace all of it.
 */

/** Longer than any real CV, and past the point where the model is useful. */
export const PDF_TEXT_LIMIT = 200_000;

/**
 * Pulls the text layer out of a PDF.
 *
 * Returns an empty string for a PDF that has no text layer, which is what a
 * scanned or photographed CV looks like. Callers should treat that as "read it
 * another way", not as a parse failure. Throws only when the file itself
 * cannot be opened.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const { extractText } = await import("unpdf");
  // Copy the bytes: pdfjs may detach the array it is handed, and the caller
  // still needs the original buffer to store the file.
  const { text } = await extractText(new Uint8Array(buffer), {
    mergePages: true,
  });
  return text.replace(/\s+/g, " ").trim();
}
