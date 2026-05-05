-- Track successful logins on CadreProfessional. Used to distinguish a
-- CONVERTED record that actually completed the auth handshake from one
-- that hit the May 2026 CADRE_PORTAL_SECRET orphan-state bug (DB write
-- committed, JWT signing threw, user locked out without realising).
ALTER TABLE "CadreProfessional"
  ADD COLUMN "lastLoginAt" TIMESTAMP(3);
