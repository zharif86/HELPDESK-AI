const SECRET_KEYS = new Set([
  "password",
  "passwordhash",
  "confirmpassword",
  "currentpassword",
  "newpassword",
  "token",
  "tokenhash",
  "secret",
  "authorization",
]);

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      output[key] = SECRET_KEYS.has(key.toLowerCase()) ? "[redacted]" : redact(child);
    }
    return output;
  }
  return value;
}
