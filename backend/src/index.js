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

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "8mb" }));

// Uploaded images (multer) — served statically for <img> tags.
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Routes
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

// Fallback error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Mubarak Hostels backend running at http://localhost:${port}`);
});