import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

// O middleware roda no Edge e usa apenas a configuração leve (sem Prisma).
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Protege todas as rotas sob /admin (a lógica de redirecionamento e a
  // liberação de /admin/login estão no callback `authorized`).
  matcher: ["/admin/:path*"],
};
