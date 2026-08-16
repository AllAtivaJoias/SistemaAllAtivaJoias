import { Clock, Facebook, Gem, Globe, Instagram, Mail, MapPin, MessageCircle, Youtube } from "lucide-react";

import {
  formatCompanyAddress,
  instagramHref,
  safeHttpHref,
  whatsappHref,
} from "@/lib/app-settings";
import { getAppSettings } from "@/lib/app-settings-query";
import { formatPhone } from "@/lib/format";

interface FooterProps {
  /** Texto administrável (Aparência da Loja). Cai no padrão quando ausente. */
  tagline?: string;
}

export async function Footer({ tagline }: FooterProps = {}) {
  const company = await getAppSettings();
  const taglineText =
    tagline?.trim() ||
    company.brandTagline.trim() ||
    "Joalheria de alto padrão — elegância em cada detalhe.";
  const storeName = company.storeName.trim() || "AllAtiva Joias";
  const wa = whatsappHref(company.whatsapp);
  const ig = instagramHref(company.instagram);
  const web = safeHttpHref(company.website);
  const facebook = safeHttpHref(company.facebookUrl);
  const youtube = safeHttpHref(company.youtubeUrl);
  const tiktok = safeHttpHref(company.tiktokUrl);
  const email = company.email.trim();
  const phoneLabel = company.whatsapp.trim()
    ? formatPhone(company.whatsapp)
    : company.phone.trim()
      ? formatPhone(company.phone)
      : "";
  const address = formatCompanyAddress(company);
  const hours = company.businessHours.trim();

  const iconLinks = [
    ig
      ? { label: "Instagram", href: ig, Icon: Instagram, external: true }
      : null,
    facebook
      ? { label: "Facebook", href: facebook, Icon: Facebook, external: true }
      : null,
    youtube
      ? { label: "YouTube", href: youtube, Icon: Youtube, external: true }
      : null,
    tiktok
      ? { label: "TikTok", href: tiktok, Icon: Globe, external: true }
      : null,
    web
      ? { label: "Site oficial — comprar", href: web, Icon: Globe, external: true }
      : null,
    wa
      ? {
          label: phoneLabel ? `WhatsApp — ${phoneLabel}` : "WhatsApp",
          href: wa,
          Icon: MessageCircle,
          external: true,
        }
      : null,
    email
      ? {
          label: `E-mail — ${email}`,
          href: `mailto:${email}`,
          Icon: Mail,
          external: false,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <footer className="mt-16 border-t border-border bg-card text-card-foreground">
      <div className="container flex flex-col items-center gap-5 py-10 text-center">
        <div className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-primary" />
          <span className="font-serif text-lg font-semibold text-foreground">
            {storeName}
          </span>
        </div>

        <p className="text-sm text-muted-foreground">{taglineText}</p>

        {iconLinks.length > 0 && (
          <div className="flex items-center gap-4">
            {iconLinks.map(({ label, href, Icon, external }) => (
              <a
                key={label}
                href={href}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                aria-label={label}
                title={label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        )}

        {(wa || email) && (
          <div className="space-y-1 text-sm text-muted-foreground">
            {wa && (
              <p>
                Atendimento via WhatsApp:{" "}
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-link hover:text-link-hover hover:underline"
                >
                  {phoneLabel || "WhatsApp"}
                </a>
              </p>
            )}
            {email && (
              <p>
                Envie uma mensagem:{" "}
                <a
                  href={`mailto:${email}`}
                  className="font-medium text-link hover:text-link-hover hover:underline"
                >
                  {email}
                </a>
              </p>
            )}
          </div>
        )}

        {address && (
          <p className="inline-flex max-w-lg items-start justify-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>{address}</span>
          </p>
        )}

        {hours && (
          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium text-foreground">
              Horário de atendimento
            </p>
            <p className="mt-1.5 inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" aria-hidden />
              <span>{hours}</span>
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
