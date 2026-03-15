import type {
  File as PrismaFile,
  FileView,
  Folder,
  Share,
  User,
  VaultAccessLog,
  VaultAsset,
  VaultFile,
} from "@prisma/client";
import type {
  AptosRuntimeStatus,
  NormalizedNftAsset,
  NftOwnershipVerificationResult,
  WalletSignedChallenge,
  WalletAuthStatus,
  WalletLoginChallenge,
  WalletSessionRecord,
} from "@/lib/aptos/types";

export type FolderRecord = Folder;
export type ShareRecord = Share;
export type FileEventRecord = FileView;
export type OwnedDigitalAssetRecord = NormalizedNftAsset;

export type FileRecord = PrismaFile & {
  folder: Folder | null;
  shares: Share[];
  views: FileView[];
};

export type VaultFileRecord = VaultFile & {
  file: PrismaFile;
};

export type VaultAssetRecord = VaultAsset & {
  shares: Share[];
  vaultFiles: VaultFileRecord[];
  accessLogs: VaultAccessLog[];
};

export type CurrentUserProfile = {
  user: User;
  stats: {
    folderCount: number;
    fileCount: number;
    shareCount: number;
    vaultAssetCount: number;
  };
  recentUploads: PrismaFile[];
  recentActivity: (FileView & {
    file: PrismaFile;
  })[];
};

export type AuthSessionPayload = {
  user: User;
  session: WalletSessionRecord;
  auth: WalletAuthStatus;
};

export type WalletChallengePayload = {
  challenge: WalletLoginChallenge;
  auth: WalletAuthStatus;
};

export type WalletChallengeVerifyPayload = WalletSignedChallenge;

export type AptosStatusPayload = {
  aptos: AptosRuntimeStatus;
  auth: WalletAuthStatus;
};

export type OwnershipVerificationPayload = NftOwnershipVerificationResult & {
  isOwner: boolean;
};

export type FileSharedPayload = {
  resourceType: "file";
  share: Share & {
    downloadPriceApt?: number | null;
    sharerWallet?: string | null;
  };
  file: PrismaFile & {
    folder: Folder | null;
    user: User;
  };
  locked: boolean;
  expired: boolean;
  requiresPayment?: boolean;
};

export type VaultSharedPayload = {
  resourceType: "vault";
  share: Share;
  vaultAsset: VaultAsset & {
    user: User;
    vaultFiles: VaultFileRecord[];
  };
  locked: boolean;
  expired: boolean;
};

export type SharedResourcePayload = FileSharedPayload | VaultSharedPayload;
