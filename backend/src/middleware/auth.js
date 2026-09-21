import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const SECRET = () => process.env.JWT_SECRET || "dev_secret";

/** Whether the login requirement is disabled (AUTH_DISABLED=true in .env). */
const authDisabled = () =>
  String(process.env.AUTH_DISABLED || "").toLowerCase() === "true";

/**
 * The account to fall back to when AUTH_DISABLED is on. Uses the first admin
 * in the database, or a synthetic super admin if none exists yet.
 */
async function defaultUser() {
  try {
    const [rows] = await pool.query(
      "SELECT id, role, email FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1"
    );
    if (rows[0]) return { id: rows[0].id, role: rows[0].role, email: rows[0].email };
  } catch {
    // fall through to the synthetic account
  }
  return { id: 1, role: "admin", email: "dev@local" };
}

/** Create a signed JWT for the given user row. */
export function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    SECRET(),
    { expiresIn: "7d" }
  );
}

/**
 * Require a valid Bearer token; attach the decoded user to req.user.
 * When AUTH_DISABLED=true a valid token is still honoured, but requests
 * without one are signed in as the default admin instead of being rejected.
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");
  if (token) {
    try {
      req.user = jwt.verify(token, SECRET());
      return next();
    } catch {
      return res.status(401).json({ error: "Session expired. Please sign in again." });
    }
  }
  if (authDisabled()) {
    req.user = await defaultUser();
    return next();
  }
  return res.status(401).json({ error: "You are not signed in." });
}

/** Require the authenticated user to be an admin. */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Only the owner can perform this action." });
  }
  next();
}

/**
 * Require the authenticated user to be a hostel admin (role "warden") or the
 * super admin. A hostel admin is scoped to a single hostel via users.hostel_id;
 * the route is responsible for filtering data to that hostel.
 */
export function requireHostelAdmin(req, res, next) {
  if (!["warden", "admin"].includes(req.user?.role)) {
    return res
      .status(403)
      .json({ error: "Only a hostel admin or the super admin can perform this action." });
  }
  next();
}