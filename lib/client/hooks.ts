"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/client/api";
import type {
  AptosStatusPayload,
  CurrentUserProfile,
  FileRecord,
  FolderRecord,
  OwnershipVerificationPayload,
  OwnedDigitalAssetRecord,
  ShareRecord,
  VaultAssetRecord,
} from "@/lib/types";

export function useCurrentUser(walletAddress: string, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["me", walletAddress],
    queryFn: () => apiFetch<CurrentUserProfile>("/api/me", {}, walletAddress),
    enabled: (opts?.enabled ?? true) && Boolean(walletAddress),
  });
}

export function useFolders(walletAddress: string) {
  return useQuery({
    queryKey: ["folders", walletAddress],
    queryFn: () =>
      apiFetch<{ folders: FolderRecord[] }>("/api/folders", {}, walletAddress),
    enabled: Boolean(walletAddress),
  });
}

type FileSortField = "name" | "size" | "date" | "type";
type FileSortDir = "asc" | "desc";
type FileScope = "folder" | "workspace";

type UseFilesOptions = {
  folderId?: string | null;
  search?: string;
  sortField?: FileSortField;
  sortDir?: FileSortDir;
  scope?: FileScope;
  enabled?: boolean;
};

export function useFiles(walletAddress: string, options: UseFilesOptions = {}) {
  const params = new URLSearchParams();

  if (options.folderId) {
    params.set("folderId", options.folderId);
  }
  if (options.search?.trim()) {
    params.set("search", options.search.trim());
  }
  if (options.sortField) {
    params.set("sortField", options.sortField);
  }
  if (options.sortDir) {
    params.set("sortDir", options.sortDir);
  }
  if (options.scope) {
    params.set("scope", options.scope);
  }

  const query = params.toString();

  return useQuery({
    queryKey: [
      "files",
      walletAddress,
      options.folderId ?? null,
      options.search ?? "",
      options.sortField ?? "date",
      options.sortDir ?? "desc",
      options.scope ?? "workspace",
    ],
    queryFn: () =>
      apiFetch<{ files: FileRecord[] }>(`/api/files${query ? `?${query}` : ""}`, {}, walletAddress),
    enabled: options.enabled ?? Boolean(walletAddress),
  });
}

export function useVaultAssets(walletAddress: string) {
  return useQuery({
    queryKey: ["vault-assets", walletAddress],
    queryFn: () =>
      apiFetch<{ vaultAssets: VaultAssetRecord[] }>(
        "/api/vault/assets",
        {},
        walletAddress,
      ),
  });
}

export function useVaultAsset(walletAddress: string, vaultAssetId: string) {
  return useQuery({
    queryKey: ["vault-asset", walletAddress, vaultAssetId],
    queryFn: () =>
      apiFetch<{ vaultAsset: VaultAssetRecord }>(
        `/api/vault/assets/${vaultAssetId}`,
        {},
        walletAddress,
      ),
  });
}

export function useWalletNfts(walletAddress: string) {
  return useQuery({
    queryKey: ["wallet-nfts", walletAddress],
    queryFn: () =>
      apiFetch<{ nfts: OwnedDigitalAssetRecord[]; aptos: AptosStatusPayload["aptos"] }>(
        "/api/vault/nfts",
        {},
        walletAddress,
      ),
  });
}

export function useCreateVaultAsset(walletAddress: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      nftObjectId: string;
      collectionName?: string | null;
      nftName?: string | null;
      publicPreviewMode?: string;
      ownerOnly?: boolean;
    }) =>
      apiFetch<{ vaultAsset: VaultAssetRecord }>(
        "/api/vault/assets",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        walletAddress,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vault-assets", walletAddress] });
      void queryClient.invalidateQueries({ queryKey: ["me", walletAddress] });
      void queryClient.invalidateQueries({ queryKey: ["wallet-nfts", walletAddress] });
    },
  });
}

export function useUploadVaultFile(walletAddress: string, vaultAssetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      file: File;
      role: string;
      description?: string;
      encrypt?: boolean;
    }) => {
      const formData = new FormData();
      formData.set("file", payload.file);
      formData.set("role", payload.role);
      if (payload.description) {
        formData.set("description", payload.description);
      }
      if (payload.encrypt) {
        formData.set("encrypt", "true");
      }

      return apiFetch<{ file: FileRecord }>(
        `/api/vault/assets/${vaultAssetId}/upload`,
        {
          method: "POST",
          body: formData,
        },
        walletAddress,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["vault-asset", walletAddress, vaultAssetId],
      });
      void queryClient.invalidateQueries({ queryKey: ["vault-assets", walletAddress] });
    },
  });
}

export function useVerifyVaultOwnership(walletAddress: string, vaultAssetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<OwnershipVerificationPayload>(
        `/api/vault/assets/${vaultAssetId}/verify-ownership`,
        {
          method: "POST",
        },
        walletAddress,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["vault-asset", walletAddress, vaultAssetId],
      });
    },
  });
}

export function useCreateVaultShare(walletAddress: string, vaultAssetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      shareType: "PUBLIC" | "PRIVATE" | "PASSWORD";
      password?: string;
      expiresAt?: string;
    }) =>
      apiFetch<{ share: ShareRecord }>(
        `/api/vault/assets/${vaultAssetId}/share`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        walletAddress,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["vault-asset", walletAddress, vaultAssetId],
      });
      void queryClient.invalidateQueries({ queryKey: ["vault-assets", walletAddress] });
      void queryClient.invalidateQueries({ queryKey: ["me", walletAddress] });
    },
  });
}

export function useRevokeShare(walletAddress: string, vaultAssetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) =>
      apiFetch<{ success: boolean }>(
        `/api/shares/${shareId}`,
        { method: "DELETE" },
        walletAddress,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["vault-asset", walletAddress, vaultAssetId],
      });
      void queryClient.invalidateQueries({ queryKey: ["vault-assets", walletAddress] });
      void queryClient.invalidateQueries({ queryKey: ["me", walletAddress] });
    },
  });
}
