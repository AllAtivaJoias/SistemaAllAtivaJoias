import { buildThemeStyleSheet } from "@/lib/theme/registry";
import { DEFAULT_THEME, type ThemeConfig } from "@/lib/theme/tokens";

/** Script estático — não interpola dados do banco. */
const BOOTSTRAP = `(function(){try{var r=document.documentElement;var mode=r.getAttribute("data-theme-mode");var allow=r.getAttribute("data-theme-user")==="1";var pref=allow?localStorage.getItem("allativa-color-scheme"):null;var dark=mode==="DARK";if(mode==="SYSTEM"){dark=window.matchMedia("(prefers-color-scheme: dark)").matches;}if(allow&&pref==="dark")dark=true;if(allow&&pref==="light")dark=false;if(dark)r.classList.add("dark");else r.classList.remove("dark");}catch(e){}})();`;

export function ThemeStyle({ theme }: { theme: ThemeConfig }) {
  const css = buildThemeStyleSheet(theme ?? DEFAULT_THEME);
  return (
    <>
      <style id="allativa-theme">{css}</style>
      <script id="allativa-theme-bootstrap" dangerouslySetInnerHTML={{ __html: BOOTSTRAP }} />
    </>
  );
}
