"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";

export type LoginState = { error?: string } | undefined;

export async function authenticate(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha inválidos." };
    }
    // Reengloba o redirect do Next (NEXT_REDIRECT) para funcionar.
    throw error;
  }
  return undefined;
}
