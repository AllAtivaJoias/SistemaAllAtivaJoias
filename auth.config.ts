import type { NextAuthConfig } from "next-auth";

/**
 * Configuração Edge-safe (middleware). Sem Prisma, bcrypt ou Node APIs.
 * O provider Credentials (authorize) vive em `auth.ts` (Node runtime).
 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 horas

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  providers: [],
  callbacks: {
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
        return isLoggedIn;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as { role?: string }).role ?? "ADMIN";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        (session.user as { role?: string }).role =
          typeof token.role === "string" ? token.role : "ADMIN";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
