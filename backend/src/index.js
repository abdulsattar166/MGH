import "dotenv/config";
import { createApp } from "./app.js";

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

if (isServerless) {
  const { app } = await import("./app.js");
  const { checkDatabase, describeDbConfig } = await import("./db.js");
  console.log("[boot] serverless mode — app imported, no listener", describeDbConfig());
  checkDatabase()
    .then((r) => console.log("[boot] database", r.ok ? "connected" : `unavailable (${r.detail})`))
    .catch(() => {});
  void app;
} else {
  const port = Number(process.env.PORT) || 4000;
  createApp().listen(port, "0.0.0.0", () => {
    console.log(`Mubarak Hostels backend running at http://localhost:${port}`);
  });
}
