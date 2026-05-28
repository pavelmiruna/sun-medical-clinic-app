import crypto from "crypto";

export function generateClaimCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "0123456789";

  const part1 = Array.from({ length: 4 }, () =>
    letters[crypto.randomInt(0, letters.length)]
  ).join("");

  const part2 = Array.from({ length: 4 }, () =>
    digits[crypto.randomInt(0, digits.length)]
  ).join("");

  return `${part1}-${part2}`;
}

export function normalizeClaimCode(code) {
  return String(code || "").trim().toUpperCase();
}

export function hashClaimCode(code) {
  const secret = process.env.CLAIM_CODE_SECRET;
  if (!secret) throw new Error("Missing CLAIM_CODE_SECRET");

  return crypto
    .createHmac("sha256", secret)
    .update(normalizeClaimCode(code))
    .digest("hex");
}

export function getClaimExpiryDate() {
  const ttlDays = Number(process.env.CLAIM_CODE_TTL_DAYS || 30);
  const d = new Date();
  d.setDate(d.getDate() + ttlDays);
  return d;
}