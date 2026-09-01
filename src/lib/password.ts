import bcrypt from "bcryptjs";

// 12 rounds is the current baseline recommendation for bcrypt cost — high
// enough to resist brute-forcing, without making legitimate logins feel slow.
const SALT_ROUNDS = 12;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
