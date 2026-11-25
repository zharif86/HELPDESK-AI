import { describe, expect, it } from "vitest";
import { parentCreatesCycle } from "../src/server/org/cycles";
import { passwordIssues } from "../src/server/auth/password";
import { FixedWindowLimiter } from "../src/server/auth/rate-limit";
import { redact } from "../src/server/redact";

describe("business rules that do not need a database", () => {
  it("detects a department cycle", () => {
    const parents = new Map<string, string | null>([
      ["root", null],
      ["child", "root"],
    ]);
    expect(parentCreatesCycle("root", "child", parents)).toBe(true);
    expect(parentCreatesCycle("child", "root", parents)).toBe(false);
  });

  it("rejects a short password and redacts secrets", () => {
    expect(passwordIssues("short", "person@test.local").length).toBeGreaterThan(0);
    expect(redact({ password: "secret", name: "Aina" })).toEqual({ password: "[redacted]", name: "Aina" });
  });

  it("rate limits a repeated key", () => {
    let now = 1_000;
    const limiter = new FixedWindowLimiter(2, 1_000, () => now);
    expect(limiter.check("ip").allowed).toBe(true);
    expect(limiter.check("ip").allowed).toBe(true);
    expect(limiter.check("ip").allowed).toBe(false);
    now += 1_001;
    expect(limiter.check("ip").allowed).toBe(true);
  });
});
