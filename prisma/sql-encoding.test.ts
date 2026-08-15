import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function sqlFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      sqlFiles(full, acc);
    } else if (entry.name.endsWith(".sql")) {
      acc.push(full);
    }
  }
  return acc;
}

describe("Prisma SQL encoding", () => {
  const files = sqlFiles(path.join(process.cwd(), "prisma"));

  it("encontra os SQL de migrations e do baseline", () => {
    expect(files.some((file) => file.includes("fresh_install_baseline.sql"))).toBe(true);
    expect(files.some((file) => file.includes("jewelry_refactor"))).toBe(true);
  });

  it("nenhum arquivo SQL começa com UTF-8 BOM nem contém U+FEFF", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const buffer = readFileSync(file);
      const hasBom = buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
      const hasFeef = buffer.toString("utf8").includes("\uFEFF");
      if (hasBom || hasFeef) {
        offenders.push(path.relative(process.cwd(), file));
      }
    }
    expect(offenders).toEqual([]);
  });
});
