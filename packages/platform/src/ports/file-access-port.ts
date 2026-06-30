import type { CrosslogError, FileOpenPolicy, FileSource } from "@crosslog/core";

export interface FileSourceRef {
  readonly id: string;
  readonly name: string;
  readonly path?: string;
  readonly file?: File;
}

export type FileAccessResult =
  | { readonly ok: true; readonly source: FileSource }
  | { readonly ok: false; readonly error: CrosslogError };

export interface FileAccessPort {
  openFileReadOnly(
    sourceRef: FileSourceRef,
    options: FileOpenPolicy,
  ): Promise<FileAccessResult>;
  decodeFile(sourceRef: FileSourceRef, encodingChoice: string): Promise<string>;
  getFileIdentity(sourceRef: FileSourceRef): Promise<string>;
}
