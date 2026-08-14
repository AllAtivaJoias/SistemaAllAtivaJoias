import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Configuração base do Auth.js (NextAuth v5).
 *
 * Fica separada de `auth.ts` porque é usada também no middleware (Edge
 * Runtime). Por isso, evite importar aqui qualquer dependência de Node
 * (ex.: Prisma). O admin é um único usuário definido por variáveis de
 * ambiente, então a autorização não toca no banco.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const rawEmail = credentials?.email as string | undefined;
        const rawPassword = credentials?.password as string | undefined;

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!rawEmail || !rawPassword || !adminEmail || !adminPassword) {
          return null;
        }

        // Tolerante a espaços em volta e a maiúsculas no e-mail
        // (autofill/teclados móveis costumam adicionar variações).
        const email = rawEmail.trim().toLowerCase();
        const password = rawPassword.trim();

        const emailMatches = email === adminEmail.trim().toLowerCase();
        const passwordMatches = password === adminPassword.trim();

        if (emailMatches && passwordMatches) {
          return {
            id: "admin",
            name: "Administrador",
            email: adminEmail,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    // Protege /admin e redireciona conforme o estado de login.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname === "/admin/login";
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");

      if (isOnLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/admin", nextUrl));
        }
        return true;
      }

      if (isOnAdmin) {
        return isLoggedIn; // não logado -> redireciona para signIn (/admin/login)
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
