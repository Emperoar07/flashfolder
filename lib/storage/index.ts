import { appConfig } from "@/lib/config";
import { blobStorageAdapter } from "@/lib/storage/blob-storage";
import { localStorageAdapter } from "@/lib/storage/local-storage";
import { shelbyStorageAdapter } from "@/lib/storage/shelby-storage";
import type { StorageAdapter, StorageProviderName } from "@/lib/storage/types";
import { StorageError } from "@/lib/storage/errors";
import type { StorageProvider } from "@prisma/client";

const adaptersByProvider = {
  local: localStorageAdapter,
  blob: blobStorageAdapter,
  shelby: shelbyStorageAdapter,
} satisfies Record<StorageProviderName, StorageAdapter>;

export function getStorageRuntime() {
  if (appConfig.storageMode === "blob") {
    if (blobStorageAdapter.descriptor.configured) {
      return {
        requestedMode: "blob" as const,
        activeMode: "blob" as const,
        integrationState: "active" as const,
        adapter: blobStorageAdapter,
        fallbackReason: null,
      };
    }

    if (appConfig.failOnStorageMisconfig) {
      throw new StorageError(
        "NOT_CONFIGURED",
        blobStorageAdapter.descriptor.reason ??
          "Blob mode cannot start without a connected Vercel Blob store.",
        { status: 503 },
      );
    }

    return {
      requestedMode: "blob" as const,
      activeMode: localStorageAdapter.descriptor.mode,
      integrationState: blobStorageAdapter.descriptor.integrationState,
      adapter: localStorageAdapter,
      fallbackReason:
        blobStorageAdapter.descriptor.reason ??
        "Falling back to local storage until Vercel Blob is configured.",
    };
  }

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

export function getStorageAdapterForProvider(
  provider: StorageProvider | StorageProviderName,
) {
  const normalized = provider.toString().toLowerCase() as StorageProviderName;
  return adaptersByProvider[normalized];
}

export function toStorageProviderEnum(provider: StorageProviderName): StorageProvider {
  return provider.toUpperCase() as StorageProvider;
}

export function getEffectiveStorageUploadLimitBytes() {
  const runtime = getStorageRuntime();
  return runtime.adapter.descriptor.maxUploadBytes ?? appConfig.maxUploadBytes;
}
