import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;

export const DUMMY_PASSWORD_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_COST);

export function passwordIssues(password: string, email?: string) {
  const issues: string[] = [];
  if (password.length < 12) issues.push("Use at least 12 characters.");
  if (password.length > 128) issues.push("Use at most 128 characters.");
  if (!/[a-z]/.test(password)) issues.push("Include a lowercase letter.");
  if (!/[A-Z]/.test(password)) issues.push("Include an uppercase letter.");
  if (!/[0-9]/.test(password)) issues.push("Include a number.");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("Include a symbol.");
  if (/\s/.test(password)) issues.push("Do not include spaces.");
  const local = email?.split("@")[0]?.toLowerCase();
  if (local && local.length >= 3 && password.toLowerCase().includes(local)) {
    issues.push("Do not include your email name in the password.");
  }
  return issues;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
