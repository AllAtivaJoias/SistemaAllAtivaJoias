import { describe, expect, it } from "vitest";

import { AuthError } from "@/lib/auth-error";

describe("AuthError", () => {
  it("401 para não autenticado", () => {
    const err = new AuthError("Não autorizado. Faça login.", 401);
    expect(err.status).toBe(401);
    expect(err.name).toBe("AuthError");
  });

  it("403 para sem permissão", () => {
    const err = new AuthError("Acesso restrito a administradores.", 403);
    expect(err.status).toBe(403);
  });
});
