import { describe, expect, it } from "vitest";

import { isSafeBlobPathname } from "@/lib/blob-pathname";

describe("isSafeBlobPathname", () => {
  it("aceita pathname relativo de produto", () => {
    expect(isSafeBlobPathname("products/anel.webp")).toBe(true);
  });

  it("rejeita traversal", () => {
    expect(isSafeBlobPathname("../etc/passwd")).toBe(false);
    expect(isSafeBlobPathname("products/../../secret")).toBe(false);
  });

  it("rejeita absoluto, backslash, URL e nulo", () => {
    expect(isSafeBlobPathname("/etc/passwd")).toBe(false);
    expect(isSafeBlobPathname("foo\\bar")).toBe(false);
    expect(isSafeBlobPathname("https://evil.example/x")).toBe(false);
    expect(isSafeBlobPathname(null)).toBe(false);
    expect(isSafeBlobPathname("")).toBe(false);
  });

  it("rejeita pathname longo demais", () => {
    expect(isSafeBlobPathname("a".repeat(513))).toBe(false);
  });
});
