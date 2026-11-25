import { spawn } from "node:child_process";
import { startLocalPostgres } from "./postgres-local.mjs";

const postgres = await startLocalPostgres();
const next = spawn(process.execPath, ["./node_modules/next/dist/bin/next", "dev"], {
  stdio: "inherit",
  env: process.env,
});

async function shutdown(code = 0) {
  next.kill("SIGTERM");
  await postgres.stop().catch(() => undefined);
  process.exit(code);
}

next.on("exit", (code) => {
  void shutdown(code ?? 0);
});
process.on("SIGINT", () => {
  void shutdown(0);
});
process.on("SIGTERM", () => {
  void shutdown(0);
});
