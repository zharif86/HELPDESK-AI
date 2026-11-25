import path from "node:path";
import { defineConfig } from "vitest/config";

const testDatabaseUrl = "postgresql://helpdesk:helpdesk@127.0.0.1:5433/helpdesk_test";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    env: {
      DATABASE_URL: testDatabaseUrl,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./tests/server-only-stub.ts"),
    },
  },
});
