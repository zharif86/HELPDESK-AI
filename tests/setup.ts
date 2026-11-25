const url = process.env.DATABASE_URL ?? "";
if (!url.endsWith("/helpdesk_test")) {
  throw new Error("Refusing to run tests unless DATABASE_URL points at helpdesk_test.");
}
