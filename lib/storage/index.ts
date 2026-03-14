import { appConfig } from "@/lib/config";
import { localStorageAdapter } from "@/lib/storage/local-storage";
import { shelbyStorageAdapter } from "@/lib/storage/shelby-storage";
import type { StorageAdapter } from "@/lib/storage/types";

export function getStorageAdapter(): StorageAdapter {
  return appConfig.storageMode === "shelby"
    ? shelbyStorageAdapter
    : localStorageAdapter;
}
