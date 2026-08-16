import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";

import { ThemeStyle } from "@/components/theme/theme-style";
import { getAppSettings } from "@/lib/app-settings-query";
import { DEFAULT_THEME } from "@/lib/theme/tokens";

import "./globals.css";

export const dynamic = "force-dynamic";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getAppSettings();
  const title = settings.storeName.trim() || "AllAtiva Joias";
  const description =
    settings.brandTagline.trim() ||
    "Joalheria de alto padrão. Explore nosso catálogo de peças exclusivas.";
  const icons = settings.faviconUrl.trim()
    ? { icon: settings.faviconUrl }
    : undefined;
  const og = settings.ogImageUrl.trim();

  return {
    title,
    description,
    icons,
    openGraph: {
      title,
      description,
      locale: "pt_BR",
      type: "website",
      images: og ? [{ url: og }] : undefined,
    },
    twitter: {
      card: og ? "summary_large_image" : "summary",
      title,
      description,
      images: og ? [og] : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getAppSettings();
  const theme = settings.theme ?? DEFAULT_THEME;
  const darkClass = theme.mode === "DARK" ? "dark" : "";

  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${manrope.variable} ${playfair.variable} ${darkClass}`.trim()}
      data-theme-mode={theme.mode}
      data-theme-user={theme.allowUserToggle ? "1" : "0"}
      data-density={theme.density.toLowerCase()}
    >
      <body className="bg-background font-sans text-foreground antialiased">
        <ThemeStyle theme={theme} />
        {children}
      </body>
    </html>
  );
}
