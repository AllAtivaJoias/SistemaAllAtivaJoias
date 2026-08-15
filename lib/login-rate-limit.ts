/** Janela de brute-force no login (sem Redis; conta falhas no banco). */
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_FAILURES_PER_EMAIL = 5;
export const LOGIN_MAX_FAILURES_PER_IP = 20;

export function isLoginRateLimited(params: {
  failuresForEmail: number;
  failuresForIp: number;
}): boolean {
  return (
    params.failuresForEmail >= LOGIN_MAX_FAILURES_PER_EMAIL ||
    params.failuresForIp >= LOGIN_MAX_FAILURES_PER_IP
  );
}
