import fs from "fs";

const text = fs.readFileSync("src/lib/db.ts", "utf8");
const m = text.match(/const schema = `([\s\S]*?)`;\s*[\r\n]+db\.exec\(schema\)/);

if (!m) throw new Error("Could not find schema template literal in src/lib/db.ts");

const schema = m[1];
const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => s + ";");

const Database = require("better-sqlite3");
const db = new Database(":memory:");
db.pragma("foreign_keys = ON");

for (let i = 0; i < statements.length; i++) {
  try {
    db.exec(statements[i]);
  } catch (e: any) {
    console.error("\n❌ Failed statement #" + (i + 1));
    console.error(statements[i]);
    console.error("\nError:", e.message);
    process.exit(1);
  }
}

console.log("✅ All statements OK");