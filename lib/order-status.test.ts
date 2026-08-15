import { describe, expect, it } from "vitest";

import { assertTransition, canTransition } from "@/lib/order-status";

describe("máquina de estados do pedido", () => {
  it("permite PENDING → COMPLETED e PENDING → CANCELLED", () => {
    expect(canTransition("PENDING", "COMPLETED")).toBe(true);
    expect(canTransition("PENDING", "CANCELLED")).toBe(true);
  });

  it("bloqueia transições terminais e retrocesso", () => {
    expect(canTransition("COMPLETED", "PENDING")).toBe(false);
    expect(canTransition("COMPLETED", "CANCELLED")).toBe(false);
    expect(canTransition("CANCELLED", "PENDING")).toBe(false);
    expect(canTransition("CANCELLED", "COMPLETED")).toBe(false);
    expect(canTransition("PENDING", "PENDING")).toBe(false);
  });

  it("assertTransition lança em transição inválida", () => {
    expect(() => assertTransition("COMPLETED", "CANCELLED")).toThrow(
      /inválida/
    );
  });
});
