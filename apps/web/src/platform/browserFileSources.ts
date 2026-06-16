import { BrowserFileAccess } from "@crosslog/platform/browser/browser-file-access";
import type { FileSourceRef } from "@crosslog/platform";

export function createBrowserFileAccess(): BrowserFileAccess {
  return new BrowserFileAccess();
}

export function createBrowserFileSourceRef(file: File): FileSourceRef {
  return {
    id: `browser-file-${stableSourceKey(file.name, file.size, file.lastModified)}`,
    name: file.name,
    file,
  };
}

function stableSourceKey(name: string, size: number, modified: number): string {
  return `${name}-${size}-${modified}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
