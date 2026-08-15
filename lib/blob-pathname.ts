const MAX_PATHNAME_LENGTH = 512;

/**
 * Pathname seguro para o proxy público `/api/file`.
 * Rejeita traversal, paths absolutos e caracteres de escape.
 * Não exige o prefixo `products/` — imagens antigas podem ter outro pathname.
 */
export function isSafeBlobPathname(
  pathname: string | null | undefined
): pathname is string {
  if (!pathname) return false;
  if (pathname.length > MAX_PATHNAME_LENGTH) return false;
  if (pathname.includes("\0")) return false;
  if (pathname.includes("..")) return false;
  if (pathname.includes("\\")) return false;
  if (pathname.startsWith("/")) return false;
  if (pathname.includes("://")) return false;
  return true;
}
