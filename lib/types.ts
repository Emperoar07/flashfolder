import type {
  File as PrismaFile,
  FileView,
  Folder,
  Share,
  User,
} from "@prisma/client";

export type FolderRecord = Folder;
export type ShareRecord = Share;
export type FileEventRecord = FileView;

export type FileRecord = PrismaFile & {
  folder: Folder | null;
  shares: Share[];
  views: FileView[];
};

export type SharedFilePayload = {
  share: Share;
  file: PrismaFile & {
    folder: Folder | null;
    user: User;
  };
  locked: boolean;
  expired: boolean;
};
