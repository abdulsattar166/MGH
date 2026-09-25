import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import studentsRoutes from "./routes/students.js";
import feesRoutes from "./routes/fees.js";
import attendanceRoutes from "./routes/attendance.js";
import visitorsRoutes from "./routes/visitors.js";
import bookingsRoutes from "./routes/bookings.js";
import wardensRoutes from "./routes/hostelAdmins.js";
import wardenManageRoutes from "./routes/wardens.js";
import complaintsRoutes from "./routes/complaints.js";
import reportsRoutes from "./routes/reports.js";
import hostelsRoutes from "./routes/hostels.js";
import roomsRoutes from "./routes/rooms.js";
import buildingsRoutes from "./routes/buildings.js";
import blocksRoutes from "./routes/blocks.js";
import noticesRoutes from "./routes/notices.js";
import auditLogsRoutes from "./routes/auditLogs.js";
import publicRoutes from "./routes/public.js";
import maintenanceRoutes from "./routes/maintenance.js";
import notificationsRoutes from "./routes/notifications.js";
import improvementsRoutes from "./routes/improvements.js";
import uploadsRoutes, { UPLOADS_DIR } from "./routes/uploads.js";
import { checkDatabase, describeDbConfig } from "./db.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", true);

  // Never block a request because of CORS: any origin is reflected and
  // credentials are not used, so preflight always succeeds. Aiven/MySQL
  // access is unaffected. VERCEL_ORIGIN can be set to restrict origins.
  const restrict = String(process.env.VERCEL_ORIGIN || "").trim();
  const allowed = restrict
    ? restrict.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  app.use(
    cors({
      origin(origin, cb) {
        if (!allowed.length || !origin) return cb(null, true);
        return cb(null, allowed.includes(origin));
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
      credentials: false,
      optionsSuccessStatus: 204,
      maxAge: 86400,
    })
  );

  app.use(express.json({ limit: "8mb" }));
  app.use(express.urlencoded({ extended: true, limit: "8mb" }));

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    next();
  });

  app.use("/uploads", express.static(UPLOADS_DIR, { fallthrough: true, maxAge: "7d" }));

  app.get("/api/health", async (_req, res) => {
    const db = await checkDatabase();
    res.status(db.ok ? 200 : 503).json({
      ok: db.ok,
      database: db.ok ? "connected" : "unavailable",
      detail: db.detail,
      config: describeDbConfig(),
    });
  });

  app.use("/api/public", publicRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/students", studentsRoutes);
  app.use("/api/fees", feesRoutes);
  app.use("/api/attendance", attendanceRoutes);
  app.use("/api/visitors", visitorsRoutes);
  app.use("/api/bookings", bookingsRoutes);
  app.use("/api/hostel-admins", wardensRoutes);
  app.use("/api/wardens", wardenManageRoutes);
  app.use("/api/complaints", complaintsRoutes);
  app.use("/api/reports", reportsRoutes);
  app.use("/api/hostels", hostelsRoutes);
  app.use("/api/rooms", roomsRoutes);
  app.use("/api/buildings", buildingsRoutes);
  app.use("/api/blocks", blocksRoutes);
  app.use("/api/notices", noticesRoutes);
  app.use("/api/audit-logs", auditLogsRoutes);
  app.use("/api/maintenance", maintenanceRoutes);
  app.use("/api/notifications", notificationsRoutes);
  app.use("/api/improvements", improvementsRoutes);
  app.use("/api/uploads", uploadsRoutes);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Endpoint not found." });
  });

  app.use((err, _req, res, _next) => {
    console.error("[api-error]", err?.message || err);
    const isDb =
      /ER_|ECONN|ETIMEDOUT|ENOTFOUND|pool|deadlock|Lost connection|timeout/i.test(
        String(err?.code || "") + " " + String(err?.message || "")
      );
    res.status(isDb ? 503 : 500).json({
      error: isDb
        ? "Database is temporarily unavailable. Please try again."
        : "Internal server error.",
    });
  });

  return app;
}

export const app = createApp();

export { UPLOADS_DIR, path, __dirname };
