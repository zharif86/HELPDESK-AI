import EmbeddedPostgres from "embedded-postgres";
import path from "node:path";

const port = Number(process.env.POSTGRES_PORT ?? 5433);

export async function startLocalPostgres() {
  const pg = new EmbeddedPostgres({
    databaseDir: path.resolve(".data/postgres"),
    user: "helpdesk",
    password: "helpdesk",
    port,
    persistent: true,
  });

  try {
    await pg.initialise();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already|exists|not empty|initdb/i.test(message)) throw error;
  }

  await pg.start();

  try {
    await pg.createDatabase("helpdesk");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already exists/i.test(message)) throw error;
  }

  console.log(`PostgreSQL is ready on 127.0.0.1:${port}, database helpdesk.`);
  return pg;
}

const invokedDirectly = process.argv[1]?.includes("postgres-local");
if (invokedDirectly) {
  await startLocalPostgres();
  await new Promise(() => {});
}
