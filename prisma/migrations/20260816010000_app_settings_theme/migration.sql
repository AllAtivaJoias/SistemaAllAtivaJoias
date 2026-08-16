-- Design tokens + white-label fields on AppSettings.

ALTER TABLE "AppSettings" ADD COLUMN "ogImageUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AppSettings" ADD COLUMN "brandTagline" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AppSettings" ADD COLUMN "facebookUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AppSettings" ADD COLUMN "youtubeUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AppSettings" ADD COLUMN "tiktokUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AppSettings" ADD COLUMN "themePreset" TEXT NOT NULL DEFAULT 'jade';
ALTER TABLE "AppSettings" ADD COLUMN "themeMode" TEXT NOT NULL DEFAULT 'LIGHT';
ALTER TABLE "AppSettings" ADD COLUMN "themeAllowUserToggle" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AppSettings" ADD COLUMN "themeRadius" TEXT NOT NULL DEFAULT '0.3rem';
ALTER TABLE "AppSettings" ADD COLUMN "themeDensity" TEXT NOT NULL DEFAULT 'DEFAULT';
ALTER TABLE "AppSettings" ADD COLUMN "fontHeading" TEXT NOT NULL DEFAULT 'playfair';
ALTER TABLE "AppSettings" ADD COLUMN "fontBody" TEXT NOT NULL DEFAULT 'manrope';
ALTER TABLE "AppSettings" ADD COLUMN "themeLight" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "AppSettings" ADD COLUMN "themeDark" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "AppSettings" ADD COLUMN "themePublishedAt" TIMESTAMP(3);