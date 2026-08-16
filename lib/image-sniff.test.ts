import { describe, expect, it } from "vitest";

import { imageExtensionMatchesMime, sniffImageMime } from "@/lib/image-sniff";

describe("sniffImageMime", () => {
  it("reconhece JPEG, PNG, GIF e WEBP", () => {
    expect(sniffImageMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(
      sniffImageMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ).toBe("image/png");
    expect(sniffImageMime(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))).toBe(
      "image/gif"
    );
    const webp = new Uint8Array(12);
    webp.set([0x52, 0x49, 0x46, 0x46], 0);
    webp.set([0x57, 0x45, 0x42, 0x50], 8);
    expect(sniffImageMime(webp)).toBe("image/webp");
  });

  it("rejeita conteúdo que não é imagem", () => {
    expect(sniffImageMime(new Uint8Array([0x3c, 0x73, 0x76, 0x67]))).toBeNull();
    expect(sniffImageMime(new Uint8Array([0x00, 0x00]))).toBeNull();
  });

  it("confere extensão só quando ela existe", () => {
    expect(imageExtensionMatchesMime("logo.png", "image/png")).toBe(true);
    expect(imageExtensionMatchesMime("logo.jpg", "image/png")).toBe(false);
    expect(imageExtensionMatchesMime("logo", "image/png")).toBe(true);
  });
});
