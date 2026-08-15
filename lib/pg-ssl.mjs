import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import tls from "node:tls";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SSL_QUERY_KEYS = ["sslmode", "sslrootcert", "sslcert", "sslkey", "ssl", "uselibpqcompat"];

const CLOUD_HOST_RE =
  /supabase\.(co|com)|pooler\.supabase|neon\.tech|rds\.amazonaws\.com|\.prisma\.io/i;

/** CA pública do Supabase (prod-ca-2021). Não é segredo — é a raiz publicada pelo provedor. */
const SUPABASE_PROD_CA_2021 = `-----BEGIN CERTIFICATE-----
MIIDxDCCAqygAwIBAgIUbLxMod62P2ktCiAkxnKJwtE9VPYwDQYJKoZIhvcNAQEL
BQAwazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5l
dyBDYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJh
c2UgUm9vdCAyMDIxIENBMB4XDTIxMDQyODEwNTY1M1oXDTMxMDQyNjEwNTY1M1ow
azELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5ldyBD
YXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJhc2Ug
Um9vdCAyMDIxIENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqQXW
QyHOB+qR2GJobCq/CBmQ40G0oDmCC3mzVnn8sv4XNeWtE5XcEL0uVih7Jo4Dkx1Q
DmGHBH1zDfgs2qXiLb6xpw/CKQPypZW1JssOTMIfQppNQ87K75Ya0p25Y3ePS2t2
GtvHxNjUV6kjOZjEn2yWEcBdpOVCUYBVFBNMB4YBHkNRDa/+S4uywAoaTWnCJLUi
cvTlHmMw6xSQQn1UfRQHk50DMCEJ7Cy1RxrZJrkXXRP3LqQL2ijJ6F4yMfh+Gyb4
O4XajoVj/+R4GwywKYrrS8PrSNtwxr5StlQO8zIQUSMiq26wM8mgELFlS/32Uclt
NaQ1xBRizkzpZct9DwIDAQABo2AwXjALBgNVHQ8EBAMCAQYwHQYDVR0OBBYEFKjX
uXY32CztkhImng4yJNUtaUYsMB8GA1UdIwQYMBaAFKjXuXY32CztkhImng4yJNUt
aUYsMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAB8spzNn+4VU
tVxbdMaX+39Z50sc7uATmus16jmmHjhIHz+l/9GlJ5KqAMOx26mPZgfzG7oneL2b
VW+WgYUkTT3XEPFWnTp2RJwQao8/tYPXWEJDc0WVQHrpmnWOFKU/d3MqBgBm5y+6
jB81TU/RG2rVerPDWP+1MMcNNy0491CTL5XQZ7JfDJJ9CCmXSdtTl4uUQnSuv/Qx
Cea13BX2ZgJc7Au30vihLhub52De4P/4gonKsNHYdbWjg7OWKwNv/zitGDVDB9Y2
CMTyZKG3XEu5Ghl1LEnI3QmEKsqaCLv12BnVjbkSeZsMnevJPs1Ye6TjjJwdik5P
o/bKiIz+Fq8=
-----END CERTIFICATE-----
`;

const VENDOR_CA_FILES = [
  path.join(root, "certs", "supabase-prod-ca-2021.crt"),
  path.join(root, "certs", "aws-rds-global-bundle.pem"),
];

function parseUrl(connectionString) {
  try {
    return new URL(connectionString);
  } catch {
    return null;
  }
}

function sslModeOf(connectionString) {
  return parseUrl(connectionString)?.searchParams.get("sslmode")?.toLowerCase() ?? "";
}

function isLoopbackHost(hostname) {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export function safeHostname(connectionString) {
  return parseUrl(connectionString)?.hostname || "(invalid-url)";
}

export function needsSsl(connectionString) {
  const parsed = parseUrl(connectionString);
  const mode = sslModeOf(connectionString);
  if (mode === "disable") {
    return false;
  }
  if (mode === "require" || mode === "verify-ca" || mode === "verify-full") {
    return true;
  }
  if (parsed && isLoopbackHost(parsed.hostname)) {
    return false;
  }
  return CLOUD_HOST_RE.test(connectionString);
}

export function stripSslQueryParams(connectionString) {
  const parsed = parseUrl(connectionString);
  if (!parsed) {
    return connectionString;
  }
  for (const key of SSL_QUERY_KEYS) {
    parsed.searchParams.delete(key);
  }
  return parsed.toString();
}

function readPemIfPresent(filePath) {
  if (!filePath || !existsSync(filePath)) {
    return "";
  }
  return readFileSync(filePath, "utf8").trim();
}

export function extraCaPems() {
  const pems = [];
  const fromEnv = process.env.POSTGRES_SSL_CA?.trim();
  if (fromEnv?.includes("BEGIN CERTIFICATE")) {
    pems.push(fromEnv);
  }
  const extraPath = process.env.PGSSLROOTCERT || process.env.POSTGRES_SSL_CA_PATH;
  const fromPath =
    extraPath && !extraPath.endsWith("allativa-pg-ca.pem") ? readPemIfPresent(extraPath) : "";
  if (fromPath.includes("BEGIN CERTIFICATE")) {
    pems.push(fromPath);
  }
  for (const vendorPath of VENDOR_CA_FILES) {
    const fromVendor = readPemIfPresent(vendorPath);
    if (fromVendor.includes("BEGIN CERTIFICATE")) {
      pems.push(fromVendor);
    }
  }
  const hasSupabaseCa = pems.some((pem) =>
    pem.includes("MIIDxDCCAqygAwIBAgIUbLxMod62P2ktCiAkxnKJwtE9VPYw")
  );
  if (!hasSupabaseCa) {
    pems.push(SUPABASE_PROD_CA_2021.trim());
  }
  return pems;
}

/** CAs do Node + CAs extras do provedor. Usado pelo `pg` e pelo arquivo sslrootcert do Prisma. */
export function trustStorePems() {
  return [...tls.rootCertificates, ...extraCaPems()];
}

let cachedCombinedPath;

export function combinedCaFilePath() {
  if (cachedCombinedPath && existsSync(cachedCombinedPath)) {
    return cachedCombinedPath;
  }
  const dest = path.join(os.tmpdir(), "allativa-pg-ca.pem");
  writeFileSync(dest, `${trustStorePems().join("\n")}\n`, { encoding: "utf8", mode: 0o600 });
  cachedCombinedPath = dest;
  return dest;
}

/**
 * @param {string} connectionString
 * @returns {import("node:tls").ConnectionOptions | undefined}
 */
export function pgSslOptions(connectionString) {
  if (!needsSsl(connectionString)) {
    return undefined;
  }
  return {
    rejectUnauthorized: true,
    minVersion: "TLSv1.2",
    ca: trustStorePems(),
  };
}

/**
 * @param {string} connectionString
 * @returns {{ connectionString: string, ssl?: import("node:tls").ConnectionOptions }}
 */
export function pgClientConfig(connectionString) {
  const ssl = pgSslOptions(connectionString);
  return {
    connectionString: ssl ? stripSslQueryParams(connectionString) : connectionString,
    ...(ssl ? { ssl } : {}),
  };
}

export function prismaSslUrl(connectionString) {
  if (!needsSsl(connectionString)) {
    return connectionString;
  }
  const parsed = parseUrl(connectionString);
  if (!parsed) {
    return connectionString;
  }
  parsed.searchParams.delete("uselibpqcompat");
  parsed.searchParams.set("sslmode", "verify-full");
  parsed.searchParams.set("sslrootcert", combinedCaFilePath().replace(/\\/g, "/"));
  return parsed.toString();
}

export function sanitizeDbError(error) {
  const err = error && typeof error === "object" ? error : { message: String(error) };
  const code = typeof err.code === "string" || typeof err.code === "number" ? String(err.code) : "UNKNOWN";
  let message = String(err.message ?? error);

  message = message.replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, "postgresql://***@");
  message = message.replace(/(password|pwd|secret|token|api[_-]?key)\s*[=:]\s*[^\s&]+/gi, "$1=***");
  message = message.replace(/[a-z][a-z0-9+.-]*:\/\/[^\s'"]+/gi, (match) => {
    try {
      const parsed = new URL(match);
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    } catch {
      return "[redacted-url]";
    }
  });

  return { code, message };
}
