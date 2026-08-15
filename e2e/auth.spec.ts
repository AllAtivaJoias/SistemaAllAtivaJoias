import { test, expect } from "@playwright/test";

test.describe("acesso e autorização", () => {
  test("página de login é pública", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(
      page.getByRole("heading", { name: /AllAtiva Joias/i })
    ).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();
  });

  test("admin sem sessão redireciona para login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("login inválido permanece na tela de login", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("E-mail").fill("nobody@example.com");
    await page.getByLabel("Senha").fill("wrong-password-xx");
    await page.getByRole("button", { name: /Entrar/i }).click();
    await expect(page.getByText(/inválidos/i)).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("API de pedidos pendentes exige autenticação", async ({ request }) => {
    const res = await request.get("/api/admin/orders/pending");
    expect(res.status()).toBe(401);
  });

  test("API de upload exige autenticação", async ({ request }) => {
    const res = await request.post("/api/upload");
    expect(res.status()).toBe(401);
  });

  test("API de seed de pedras exige autenticação", async ({ request }) => {
    const res = await request.post("/api/insumos/seed-pedras");
    expect(res.status()).toBe(401);
  });
});
