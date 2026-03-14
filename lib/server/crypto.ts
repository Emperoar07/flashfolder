import crypto from "node:crypto";

import { appConfig } from "@/lib/config";

type EncryptionPayload = {
  iv: string;
  tag: string;
};

function getKey() {
  return crypto
    .createHash("sha256")
    .update(appConfig.vaultEncryptionSecret)
    .digest();
}

export function encryptVaultBuffer(buffer: Buffer) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    buffer: encrypted,
    encryptedKeyRef: JSON.stringify({
      iv: iv.toString("base64"),
      tag: tag.toString("base64"),
    } satisfies EncryptionPayload),
  };
}

export function decryptVaultBuffer(buffer: Buffer, encryptedKeyRef: string) {
  const payload = JSON.parse(encryptedKeyRef) as EncryptionPayload;
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(payload.iv, "base64"),
  );

  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  return Buffer.concat([decipher.update(buffer), decipher.final()]);
}
