-- Add employer-branding columns to CadreFacility. Both optional and nullable.
ALTER TABLE "CadreFacility" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "CadreFacility" ADD COLUMN "bannerUrl" TEXT;
