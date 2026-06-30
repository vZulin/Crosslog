import type { DirectoryEntryDescriptor, DirectorySourceRef } from "../ports/directory-access-port";
import type { FileSourceRef } from "../ports/file-access-port";
import type { SourcePickerPort } from "../ports/source-picker-port";

export class BrowserSourcePicker implements SourcePickerPort {
  constructor(private readonly documentRef: Document | null = getDefaultDocument()) {}

  async pickFiles(): Promise<readonly FileSourceRef[]> {
    const files = await this.pickBrowserFiles({ directory: false });

    return files.map((file) => createBrowserFileSourceRef(file));
  }

  async pickDirectory(): Promise<DirectorySourceRef | null> {
    const files = await this.pickBrowserFiles({ directory: true });

    return createBrowserDirectorySourceRef(files);
  }

  private pickBrowserFiles(options: { readonly directory: boolean }): Promise<readonly File[]> {
    if (!this.documentRef) {
      return Promise.resolve([]);
    }

    const input = this.documentRef.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.hidden = true;
    input.dataset.crosslogSourcePicker = "true";

    if (options.directory) {
      input.setAttribute("webkitdirectory", "");
      input.setAttribute("directory", "");
    }

    this.documentRef.body.append(input);

    return new Promise((resolve) => {
      const complete = (files: readonly File[]) => {
        input.removeEventListener("change", handleChange);
        input.removeEventListener("cancel", handleCancel);
        input.remove();
        resolve(files);
      };
      const handleChange = () => complete(Array.from(input.files ?? []));
      const handleCancel = () => complete([]);

      input.addEventListener("change", handleChange);
      input.addEventListener("cancel", handleCancel);
      input.click();
    });
  }
}

export function createBrowserFileSourceRef(file: File): FileSourceRef {
  return {
    id: createBrowserSourceId("file", file.name, file.lastModified),
    name: file.name,
    file,
  };
}

function createBrowserDirectorySourceRef(files: readonly File[]): DirectorySourceRef | null {
  const directoryGroups = new Map<string, DirectoryEntryDescriptor[]>();

  for (const file of files) {
    const relativePath = file.webkitRelativePath;
    const pathParts = relativePath.split("/");

    if (pathParts.length !== 2) {
      continue;
    }

    const [directoryName, fileName] = pathParts;

    if (!directoryName || !fileName) {
      continue;
    }

    const entries = directoryGroups.get(directoryName) ?? [];
    entries.push(createBrowserDirectoryFileEntry(file, fileName));
    directoryGroups.set(directoryName, entries);
  }

  const [directoryName, entries] = directoryGroups.entries().next().value ?? [];

  if (!directoryName || !entries) {
    return null;
  }

  return {
    id: createBrowserSourceId("directory", directoryName, entries.length),
    name: directoryName,
    entries,
  };
}

function createBrowserDirectoryFileEntry(file: File, name: string): DirectoryEntryDescriptor {
  return {
    kind: "file",
    id: createBrowserSourceId("file", name, file.lastModified),
    name,
    createdAt: file.lastModified > 0 ? new Date(file.lastModified) : null,
    sizeBytes: file.size,
  };
}

function createBrowserSourceId(kind: "directory" | "file", name: string, suffix: number): string {
  return `browser-${kind}-${sanitizeSourceId(name)}-${suffix}`;
}

function sanitizeSourceId(value: string): string {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized.length > 0 ? sanitized : "source";
}

function getDefaultDocument(): Document | null {
  return typeof document === "undefined" ? null : document;
}
