import { createHash, randomBytes } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(password + salt)
    .digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  const testHash = createHash("sha256")
    .update(password + salt)
    .digest("hex");
  return hash === testHash;
}

export function generateGuestUsername(): string {
  return `guest_${randomBytes(8).toString("hex")}`;
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}
