import { describe, expect, it } from "vitest";

import {
  needsSsl,
  sanitizeDbError,
  stripSslQueryParams,
} from "@/lib/pg-ssl.mjs";

describe("needsSsl", () => {
  it("não exige SSL em loopback sem sslmode", () => {
    expect(needsSsl("postgresql://postgres:postgres@127.0.0.1:5432/app")).toBe(false);
    expect(needsSsl("postgresql://postgres@localhost:5432/app")).toBe(false);
  });

  it("exige SSL em hosts Supabase", () => {
    expect(
      needsSsl("postgresql://u:p@aws-0-us-east-1.pooler.supabase.com:5432/postgres")
    ).toBe(true);
    expect(needsSsl("postgresql://u:p@db.abcdefgh.supabase.co:5432/postgres")).toBe(true);
  });

  it("respeita sslmode na URL", () => {
    expect(needsSsl("postgresql://u:p@localhost:5432/app?sslmode=require")).toBe(true);
    expect(
      needsSsl("postgresql://u:p@db.abcdefgh.supabase.co:5432/postgres?sslmode=disable")
    ).toBe(false);
  });
});

describe("stripSslQueryParams", () => {
  it("remove sslmode sem alterar o restante da URL", () => {
    const stripped = stripSslQueryParams(
      "postgresql://user:p%40ss@db.example.com:5432/app?sslmode=require&schema=public"
    );
    expect(stripped).not.toMatch(/sslmode=/i);
    expect(stripped).toContain("schema=public");
    expect(stripped).toContain("p%40ss");
  });
});

describe("sanitizeDbError", () => {
  it("não vaza connection string nem senha", () => {
    const { code, message } = sanitizeDbError({
      code: "SELF_SIGNED_CERT_IN_CHAIN",
      message:
        "connect postgresql://user:super-secret@db.example.com:5432/app?sslmode=require failed",
    });
    expect(code).toBe("SELF_SIGNED_CERT_IN_CHAIN");
    expect(message).not.toContain("super-secret");
    expect(message).not.toMatch(/postgresql:\/\/user:/);
  });
});
