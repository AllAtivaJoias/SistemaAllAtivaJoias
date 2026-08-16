import { Clock, Gem, Globe, Instagram, Mail, MapPin, MessageCircle } from "lucide-react";

import {
  formatCompanyAddress,
  instagramHref,
  websiteHref,
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
    tagline?.trim() || "Joalheria de alto padrão — elegância em cada detalhe.";
  const storeName = company.storeName.trim() || "AllAtiva Joias";
  const wa = whatsappHref(company.whatsapp);
  const ig = instagramHref(company.instagram);
  const web = websiteHref(company.website);
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
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container flex flex-col items-center gap-5 py-10 text-center">
        <div className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-brand-600" />
          <span className="font-serif text-lg font-semibold text-slate-900">
            {storeName}
          </span>
        </div>

        <p className="text-sm text-slate-500">{taglineText}</p>

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
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        )}

        {(wa || email) && (
          <div className="space-y-1 text-sm text-slate-500">
            {wa && (
              <p>
                Atendimento via WhatsApp:{" "}
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-700 hover:underline"
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
                  className="font-medium text-brand-700 hover:underline"
                >
                  {email}
                </a>
              </p>
            )}
          </div>
        )}

        {address && (
          <p className="inline-flex max-w-lg items-start justify-center gap-1.5 text-sm text-slate-500">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />
            <span>{address}</span>
          </p>
        )}

        {hours && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-700">
              Horário de atendimento
            </p>
            <p className="mt-1.5 inline-flex items-center justify-center gap-1.5 text-sm text-slate-500">
              <Clock className="h-4 w-4 text-brand-700" aria-hidden />
              <span>{hours}</span>
            </p>
          </div>
        )}

        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
