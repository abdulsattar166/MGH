import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "node:fs";

dotenv.config();

// ---------------------------------------------------------------------------
// Managed MySQL (Aiven, PlanetScale, RDS, ...) normally requires TLS. SSL is
// auto-enabled when DB_SSL is truthy OR the host looks like a managed provider,
// so a missing DB_SSL variable can never silently break the connection.
// DB_SSL_CA (PEM string or file path) enables strict certificate verification.
// ---------------------------------------------------------------------------

const truthy = (v) => ["1", "true", "yes", "on", "required"].includes(String(v || "").trim().toLowerCase());

function readCa(value) {
  if (!value) return undefined;
  const raw = String(value);
  if (raw.includes("BEGIN CERTIFICATE")) return raw.replace(/\\n/g, "\n");
  try {
    if (fs.existsSync(raw)) return fs.readFileSync(raw, "utf8");
  } catch {
    /* ignore */
  }
  return undefined;
}

const HOST = process.env.DB_HOST || "localhost";
const MANAGED = /aivencloud\.com|planetscale|azure\.com|amazonaws\.com|rdp\.mysql|googledb|cleardb|mysql\.digitalocean/i.test(HOST);
const useSsl = truthy(process.env.DB_SSL) || (!process.env.DB_SSL && MANAGED);
const ca = readCa(process.env.DB_SSL_CA);

const ssl = useSsl
  ? ca
    ? { ca, rejectUnauthorized: true }
    : { rejectUnauthorized: false }
  : undefined;

export function describeDbConfig() {
  return {
    host: HOST,
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || "mubarak_hostels",
    user: process.env.DB_USER || "root",
    ssl: ssl ? { enabled: true, verified: Boolean(ca) } : { enabled: false },
  };
}

export const pool = mysql.createPool({
  host: HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mubarak_hostels",
  ...(ssl ? { ssl } : {}),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE) || 5,
  maxIdle: 5,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT) || 20000,
  dateStrings: true,
  charset: "utf8mb4_unicode_ci",
});

const RETRYABLE = [
  "PROTOCOL_CONNECTION_LOST",
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ER_LOCK_DEADLOCK",
  "ER_CON_COUNT_ERROR",
  "PROTOCOL_SEQUENCE_TIMEOUT",
];

const isRetryable = (err) =>
  RETRYABLE.includes(err?.code) || /timeout|deadlock|Lost connection|pool/i.test(String(err?.message || ""));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Run a query, transparently retrying transient connection failures. */
export async function query(sql, params = [], attempts = 3) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      const [rows] = await pool.query(sql, params);
      return rows;
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || i === attempts - 1) throw err;
      await sleep(200 * (i + 1));
    }
  }
  throw lastError;
}

/** Execute a statement, transparently retrying transient connection failures. */
export async function execute(sql, params = [], attempts = 3) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      const [result] = await pool.execute(sql, params);
      return result;
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || i === attempts - 1) throw err;
      await sleep(200 * (i + 1));
    }
  }
  throw lastError;
}

/** Verify the database is reachable. Never throws. */
export async function checkDatabase() {
  try {
    await pool.query("SELECT 1");
    return { ok: true, detail: "connected" };
  } catch (err) {
    return { ok: false, detail: err?.code || err?.message || "unknown" };
  }
}
