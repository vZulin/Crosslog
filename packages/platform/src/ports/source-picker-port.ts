import type { DirectorySourceRef } from "./directory-access-port";
import type { FileSourceRef } from "./file-access-port";

export interface SourcePickerPort {
  pickFiles(): Promise<readonly FileSourceRef[]>;
  pickDirectory(): Promise<DirectorySourceRef | null>;
}

