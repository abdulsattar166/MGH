import fs from "fs";
import path from "path";

const p = path.join(process.env.TEMP, "test-upload.png");
const form = new FormData();
const blob = new Blob([fs.readFileSync(p)], { type: "image/png" });
form.append("file", blob, "test-upload.png");
const r = await fetch("http://localhost:4000/api/uploads", { method: "POST", body: form });
const text = await r.text();
console.log(r.status, text);
if (r.ok) {
  const url = JSON.parse(text).url;
  const img = await fetch(url);
  console.log("GET", url, "->", img.status, img.headers.get("content-type"));
}
process.exit(0);