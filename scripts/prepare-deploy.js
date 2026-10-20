import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wranglerJsonPath = path.resolve(__dirname, "../.output/server/wrangler.json");

if (fs.existsSync(wranglerJsonPath)) {
  const content = JSON.parse(fs.readFileSync(wranglerJsonPath, "utf-8"));
  content.name = "dr-empanadas";
  content.compatibility_date = "2024-09-23";
  fs.writeFileSync(wranglerJsonPath, JSON.stringify(content, null, 2));
  console.log("✓ Updated .output/server/wrangler.json: name -> dr-empanadas, compatibility_date -> 2024-09-23");
} else {
  console.warn("wrangler.json not found at:", wranglerJsonPath);
}
