import "server-only";

import { mkdir, unlink, writeFile, access } from "node:fs/promises";
import path from "node:path";
import type { StorageDriver } from "@/server/storage/types";

const ROOT = path.resolve(process.cwd(), ".data", "attachments");

function resolveKey(storageKey: string) {
  if (!/^[a-zA-Z0-9/_.-]+$/.test(storageKey) || storageKey.includes("..")) {
    throw new Error("Invalid storage key.");
  }
  const absolutePath = path.resolve(ROOT, storageKey);
  if (!absolutePath.startsWith(ROOT)) {
    throw new Error("Invalid storage key.");
  }
  return absolutePath;
}

export const localPrivateStorage: StorageDriver = {
  async put({ storageKey, bytes }) {
    const absolutePath = resolveKey(storageKey);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, bytes);
    return { storageKey, absolutePath, sizeBytes: bytes.byteLength };
  },
  async open(storageKey) {
    const absolutePath = resolveKey(storageKey);
    try {
      await access(absolutePath);
      return { absolutePath, exists: true };
    } catch {
      return { absolutePath, exists: false };
    }
  },
  async remove(storageKey) {
    const absolutePath = resolveKey(storageKey);
    await unlink(absolutePath).catch(() => undefined);
  },
};

export function attachmentRoot() {
  return ROOT;
}
