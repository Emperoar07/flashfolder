import { appConfig } from "@/lib/config";
import { localStorageAdapter } from "@/lib/storage/local-storage";
import { shelbyStorageAdapter } from "@/lib/storage/shelby-storage";
import type { StorageAdapter } from "@/lib/storage/types";
import { StorageError } from "@/lib/storage/errors";
import type { StorageProvider } from "@prisma/client";

const adaptersByProvider = {
  local: localStorageAdapter,
  shelby: shelbyStorageAdapter,
} satisfies Record<"local" | "shelby", StorageAdapter>;

export function getStorageRuntime() {
  if (appConfig.storageMode === "shelby") {
    if (shelbyStorageAdapter.descriptor.implemented && shelbyStorageAdapter.descriptor.configured) {
      return {
        requestedMode: "shelby" as const,
        activeMode: "shelby" as const,
        integrationState: "active" as const,
        adapter: shelbyStorageAdapter,
        fallbackReason: null,
      };
    }

    if (appConfig.failOnStorageMisconfig) {
      throw new StorageError(
        shelbyStorageAdapter.descriptor.configured ? "NOT_IMPLEMENTED" : "NOT_CONFIGURED",
        shelbyStorageAdapter.descriptor.reason ??
          "Shelby mode cannot start without a real adapter implementation.",
        { status: 503 },
      );
    }

    return {
      requestedMode: "shelby" as const,
      activeMode: localStorageAdapter.descriptor.mode,
      integrationState: shelbyStorageAdapter.descriptor.integrationState,
      adapter: localStorageAdapter,
      fallbackReason:
        shelbyStorageAdapter.descriptor.reason ??
        "Falling back to local storage until Shelby is fully wired.",
    };
  }

  return {
    requestedMode: appConfig.storageMode,
    activeMode: localStorageAdapter.descriptor.mode,
    integrationState: "active" as const,
    adapter: localStorageAdapter,
    fallbackReason: null,
  };
}

export function getStorageAdapter(): StorageAdapter {
  return getStorageRuntime().adapter;
}

export function getStorageAdapterForProvider(provider: StorageProvider | "local" | "shelby") {
  const normalized = provider.toString().toLowerCase() as "local" | "shelby";
  return adaptersByProvider[normalized];
}
