/**
 * Google OAuth2 Setup Script
 *
 * Generates a refresh token for Google Calendar API access.
 *
 * Usage:
 *   1. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local
 *   2. Run: npx tsx scripts/google-oauth-setup.ts
 *   3. Open the URL it prints in your browser
 *   4. Authorize with your Google account
 *   5. Paste the code back in the terminal
 *   6. Copy the refresh token into .env.local
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
  if (!process.env[key]) process.env[key] = val;
}

import { google } from "googleapis";
import * as readline from "readline";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "\n  Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local\n" +
    "  Add them and re-run this script.\n"
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  "http://localhost:3000/api/auth/google/callback"
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/calendar"],
});

console.log("\n=== Google Calendar OAuth Setup ===\n");
console.log("1. Open this URL in your browser:\n");
console.log(`   ${authUrl}\n`);
console.log("2. Sign in with your Google account (e.g. debo@consultforafrica.com)");
console.log("3. Authorize the app");
console.log("4. You'll be redirected to a URL like:");
console.log("   http://localhost:3000/api/auth/google/callback?code=XXXXX\n");
console.log("5. Copy the 'code' parameter from that URL and paste it below:\n");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Paste the authorization code: ", async (code) => {
  rl.close();

  try {
    const { tokens } = await oauth2Client.getToken(decodeURIComponent(code));

    console.log("\n=== Success! ===\n");
    console.log("Add these to your .env.local:\n");
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log(`\nYour access token (temporary, auto-refreshes):`);
    console.log(`${tokens.access_token?.substring(0, 30)}...`);
    console.log(`\nExpires: ${tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : "unknown"}`);
    console.log("\nDone! The refresh token doesn't expire unless you revoke it.\n");
  } catch (err) {
    console.error("\nFailed to exchange code for tokens:", err);
    process.exit(1);
  }
});
