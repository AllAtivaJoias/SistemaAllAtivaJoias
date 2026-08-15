import type { ConnectionOptions } from "node:tls";

export function safeHostname(connectionString: string): string;
export function needsSsl(connectionString: string): boolean;
export function stripSslQueryParams(connectionString: string): string;
export function extraCaPems(): string[];
export function trustStorePems(): string[];
export function combinedCaFilePath(): string;
export function pgSslOptions(connectionString: string): ConnectionOptions | undefined;
export function pgClientConfig(connectionString: string): {
  connectionString: string;
  ssl?: ConnectionOptions;
};
export function prismaSslUrl(connectionString: string): string;
export function sanitizeDbError(error: unknown): { code: string; message: string };
