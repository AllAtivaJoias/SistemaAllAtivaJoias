import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { writeAuditLog } from "@/lib/audit";
import {
  isLoginRateLimited,
  LOGIN_WINDOW_MS,
} from "@/lib/login-rate-limit";

const BCRYPT_ROUNDS = 12;

async function isRateLimited(email: string, ip: string | null): Promise<boolean> {
  const since = new Date(Date.now() - LOGIN_WINDOW_MS);
  const failuresForEmail = await prisma.loginAttempt.count({
    where: { success: false, createdAt: { gte: since }, email },
  });
  const failuresForIp = ip
    ? await prisma.loginAttempt.count({
        where: { success: false, createdAt: { gte: since }, ip },
      })
    : 0;
  return isLoginRateLimited({ failuresForEmail, failuresForIp });
}

async function bootstrapAdminIfEmpty(): Promise<void> {
  const count = await prisma.user.count();
  if (count > 0) return;

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 8) {
    logger.warn("auth.bootstrap_skipped", {
      reason: "missing_or_weak_admin_env",
    });
    return;
  }

  await prisma.user.create({
    data: {
      email,
      name: "Administrador",
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      role: "ADMIN",
      isActive: true,
    },
  });
  logger.info("auth.bootstrap_admin_created", { email });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials, request) => {
        const rawEmail = credentials?.email as string | undefined;
        const rawPassword = credentials?.password as string | undefined;
        const email = rawEmail?.trim().toLowerCase() ?? "";
        const password = rawPassword ?? "";
        const ip =
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request?.headers?.get("x-real-ip") ??
          null;

        if (!email || !password) return null;

        try {
          await bootstrapAdminIfEmpty();

          if (await isRateLimited(email, ip)) {
            logger.warn("auth.rate_limited", { email });
            await prisma.loginAttempt.create({
              data: { email, success: false, ip },
            });
            return null;
          }

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.isActive) {
            await prisma.loginAttempt.create({
              data: { email, success: false, ip },
            });
            await writeAuditLog({
              action: "LOGIN_FAILURE",
              entity: "User",
              entityId: user?.id ?? null,
              after: { email, reason: "not_found_or_inactive" },
            });
            return null;
          }

          const matches = await bcrypt.compare(password, user.passwordHash);
          if (!matches) {
            await prisma.loginAttempt.create({
              data: { email, success: false, ip },
            });
            await writeAuditLog({
              action: "LOGIN_FAILURE",
              entity: "User",
              entityId: user.id,
              after: { email, reason: "bad_password" },
            });
            return null;
          }

          await prisma.$transaction([
            prisma.loginAttempt.create({
              data: { email, success: true, ip },
            }),
            prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            }),
          ]);
          await writeAuditLog({
            action: "LOGIN_SUCCESS",
            entity: "User",
            entityId: user.id,
            userId: user.id,
            after: { email },
          });

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          logger.error("auth.authorize_error", {
            message: error instanceof Error ? error.message : "unknown",
          });
          return null;
        }
      },
    }),
  ],
});
