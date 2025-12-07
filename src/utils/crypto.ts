import crypto from "crypto";

const SECRET_KEY = Buffer.from(process.env.CRYPTO_SECRET!, "hex"); // 32 bytes
const IV = Buffer.from(process.env.ENCRYPT_IV!, "hex"); // 16 bytes

export const CryptoUtil = {
  encrypt(data: string): string {
    const cipher = crypto.createCipheriv("aes-256-cbc", SECRET_KEY, IV);
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  },

  decrypt(encryptedText: string): string {
    const decipher = crypto.createDecipheriv("aes-256-cbc", SECRET_KEY, IV);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  },
};
