import { describe, expect, it } from "vitest";

import {
  isLoginRateLimited,
  LOGIN_MAX_FAILURES_PER_EMAIL,
  LOGIN_MAX_FAILURES_PER_IP,
} from "@/lib/login-rate-limit";

describe("isLoginRateLimited", () => {
  it("libera abaixo do limite", () => {
    expect(
      isLoginRateLimited({ failuresForEmail: 4, failuresForIp: 19 })
    ).toBe(false);
  });

  it("bloqueia pelo e-mail", () => {
    expect(
      isLoginRateLimited({
        failuresForEmail: LOGIN_MAX_FAILURES_PER_EMAIL,
        failuresForIp: 0,
      })
    ).toBe(true);
  });

  it("bloqueia pelo IP sem penalizar um único e-mail abaixo do limite", () => {
    expect(
      isLoginRateLimited({
        failuresForEmail: 1,
        failuresForIp: LOGIN_MAX_FAILURES_PER_IP,
      })
    ).toBe(true);
  });
});
