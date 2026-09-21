import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Managed MySQL providers (Aiven, PlanetScale, RDS, ...) require TLS. Set
// DB_SSL=true to enable it. Provide DB_SSL_CA (a PEM string or file path) to
// verify the server certificate; otherwise verification is relaxed.
const useSsl = String(process.env.DB_SSL || "").toLowerCase() === "true";
const ssl = useSsl
  ? process.env.DB_SSL_CA
    ? { ca: process.env.DB_SSL_CA, rejectUnauthorized: true }
    : { rejectUnauthorized: false }
  : undefined;

/**
 * Shared MySQL connection pool. Every route reuses this single pool.
 */
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mubarak_hostels",
  ...(ssl ? { ssl } : {}),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});