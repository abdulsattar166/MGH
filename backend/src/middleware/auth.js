import jwt from "jsonwebtoken";

const SECRET = () => process.env.JWT_SECRET || "dev_secret";

/** Create a signed JWT for the given user row. */
export function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    SECRET(),
    { expiresIn: "7d" }
  );
}

/** Require a valid Bearer token; attach the decoded user to req.user. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "You are not signed in." });
  }
  try {
    req.user = jwt.verify(token, SECRET());
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please sign in again." });
  }
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