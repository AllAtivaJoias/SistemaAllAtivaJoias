import { Clock, Gem, Globe, Instagram, Mail, MessageCircle } from "lucide-react";

const contacts = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/allativajoias/",
    Icon: Instagram,
    external: true,
  },
  {
    label: "Site oficial — comprar",
    href: "https://www.allativa.com.br/",
    Icon: Globe,
    external: true,
  },
  {
    label: "WhatsApp — (11) 93621-1188",
    href: "https://wa.me/5511936211188",
    Icon: MessageCircle,
    external: true,
  },
  {
    label: "E-mail — contato@allativa.com.br",
    href: "mailto:contato@allativa.com.br",
    Icon: Mail,
    external: false,
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container flex flex-col items-center gap-5 py-10 text-center">
        <div className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-brand-600" />
          <span className="font-serif text-lg font-semibold text-slate-900">
            AllAtiva Joias
          </span>
        </div>

        <p className="text-sm text-slate-500">
          Joalheria de alto padrão — elegância em cada detalhe.
        </p>

        {/* 1. Ícones */}
        <div className="flex items-center gap-4">
          {contacts.map(({ label, href, Icon, external }) => (
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

        {/* 2. WhatsApp e e-mail (abaixo dos ícones) */}
        <div className="space-y-1 text-sm text-slate-500">
          <p>
            Atendimento via WhatsApp:{" "}
            <a
              href="https://wa.me/5511936211188"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-700 hover:underline"
            >
              (11) 93621-1188
            </a>
          </p>
          <p>
            Envie uma mensagem:{" "}
            <a
              href="mailto:contato@allativa.com.br"
              className="font-medium text-brand-700 hover:underline"
            >
              contato@allativa.com.br
            </a>
          </p>
        </div>

        {/* 3. Horário (abaixo dos ícones + WhatsApp + e-mail) */}
        <div className="border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-slate-700">
            Horário de atendimento
          </p>
          <p className="mt-1.5 inline-flex items-center justify-center gap-1.5 text-sm text-slate-500">
            <Clock className="h-4 w-4 text-brand-700" aria-hidden />
            <span>Seg. à Sex. 8h às 16h</span>
          </p>
        </div>

        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} AllAtiva Joias. Todos os direitos
          reservados.
        </p>
      </div>
    </footer>
  );
}
