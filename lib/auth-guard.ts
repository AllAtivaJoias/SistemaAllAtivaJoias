import { auth } from "@/auth";
import type { UserRole } from "@prisma/client";

import { AuthError } from "@/lib/auth-error";

export { AuthError };

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthError("Não autorizado. Faça login.", 401);
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  const role = (session.user as { role?: UserRole | string }).role;
  if (role !== "ADMIN") {
    throw new AuthError("Acesso restrito a administradores.", 403);
  }
  return session;
}

export async function requirePermission(permission: "admin") {
  if (permission === "admin") return requireAdmin();
  throw new AuthError("Permissão desconhecida.", 403);
}

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
