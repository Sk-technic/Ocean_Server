import { Collections } from "../models";
export function generateUsername(length: number = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789_";
  let username = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    username += chars[randomIndex];
  }

  return username;
}

export async function generateUniqueUsername() {
  let username: string;
  let isTaken = true;

  while (isTaken) {
    username = generateUsername(8);
    const existingUser = await Collections.UserModel.findOne({ username });

    if (!existingUser) {
      isTaken = false;
    }
  }

  return username!;
}