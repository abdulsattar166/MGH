import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import studentsRoutes from "./routes/students.js";
import feesRoutes from "./routes/fees.js";
import attendanceRoutes from "./routes/attendance.js";
import visitorsRoutes from "./routes/visitors.js";
import bookingsRoutes from "./routes/bookings.js";
import wardensRoutes from "./routes/hostelAdmins.js";
import publicRoutes from "./routes/public.js";
import maintenanceRoutes from "./routes/maintenance.js";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "2mb" }));

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
app.use("/api/maintenance", maintenanceRoutes);

// Fallback error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Mubarak Hostels backend running at http://localhost:${port}`);
});