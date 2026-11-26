import "server-only";

import { localPrivateStorage } from "@/server/storage/local-private";
import type { StorageDriver } from "@/server/storage/types";

/** Local private disk today. Swap this export for object storage later. */
export function getAttachmentStorage(): StorageDriver {
  return localPrivateStorage;
}
