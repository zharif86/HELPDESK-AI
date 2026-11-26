export type StoredObject = {
  storageKey: string;
  absolutePath: string;
  sizeBytes: number;
};

export type StorageDriver = {
  put(input: {
    storageKey: string;
    bytes: Uint8Array;
    mimeType: string;
  }): Promise<StoredObject>;
  open(storageKey: string): Promise<{ absolutePath: string; exists: boolean }>;
  remove(storageKey: string): Promise<void>;
};
