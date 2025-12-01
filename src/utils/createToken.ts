// src/utils/tokenGenerator.ts
import bcrypt from "bcrypt";

export const generateToken = async (
  length: number
): Promise<{ rawToken: string; hashedToken: string }> => {
  if (length > 10) length = 10; // restrict max length to 10

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{};:,.<>?/";

  let rawToken = "";

  for (let i = 0; i < length; i++) {
    rawToken += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const hashedToken = await bcrypt.hash(rawToken, 10);

  return { rawToken, hashedToken };
};

export const verifyToken = async (
  rawToken: string,
  hashedToken: string | null | undefined,
  expiry?: Date | number | null
): Promise<boolean> => {
  if (!hashedToken) return false;

  // Check expiry
  if (expiry && new Date(expiry).getTime() < Date.now()) {
    return false; // token expired
  }

  // Compare token with stored hash
  return await bcrypt.compare(rawToken, hashedToken);
};