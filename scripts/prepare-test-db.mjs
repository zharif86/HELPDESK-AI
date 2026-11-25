import pg from "pg";
import { spawnSync } from "node:child_process";

const adminUrl = "postgresql://helpdesk:helpdesk@127.0.0.1:5433/helpdesk";
const testUrl = "postgresql://helpdesk:helpdesk@127.0.0.1:5433/helpdesk_test";

const admin = new pg.Client({ connectionString: adminUrl });
await admin.connect();
const existing = await admin.query("SELECT 1 FROM pg_database WHERE datname = 'helpdesk_test'");
if (existing.rowCount === 0) {
  await admin.query("CREATE DATABASE helpdesk_test");
}
await admin.end();

const result = spawnSync("npx prisma migrate deploy", {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL: testUrl },
});
process.exit(result.status ?? 1);
