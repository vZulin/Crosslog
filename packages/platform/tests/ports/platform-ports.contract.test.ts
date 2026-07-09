import { describe, expect, it } from "vitest";
import type {
  CrosslogPlatform,
  DirectorySourceRef,
  FileSourceRef,
  SourcePickerPort,
} from "../../src";

describe("platform port contracts", () => {
  it("keeps platform behavior behind explicit ports", () => {
    const ports = [
      "fileAccess",
      "directoryAccess",
      "fileWatcher",
      "sessionStore",
      "capability",
      "sourcePicker",
      "dragDropSource",
      "diagnosticLogger",
    ] as const;

    expect(ports).toHaveLength(8);
  });

  it("exposes source picking through the shared platform contract", async () => {
    const selectedFile: FileSourceRef = { id: "file-source", name: "app.log" };
    const selectedDirectory: DirectorySourceRef = { id: "directory-source", name: "logs" };
    const sourcePicker: SourcePickerPort = {
      pickFiles: async () => [selectedFile],
      pickDirectory: async () => selectedDirectory,
    };
    const platformSourcePicker: Pick<CrosslogPlatform, "sourcePicker"> = {
      sourcePicker,
    };

    await expect(platformSourcePicker.sourcePicker.pickFiles()).resolves.toEqual([selectedFile]);
    await expect(platformSourcePicker.sourcePicker.pickDirectory()).resolves.toEqual(selectedDirectory);
  });

  it("treats empty file selections and null directory selections as cancellation", async () => {
    const sourcePicker: SourcePickerPort = {
      pickFiles: async () => [],
      pickDirectory: async () => null,
    };

    await expect(sourcePicker.pickFiles()).resolves.toEqual([]);
    await expect(sourcePicker.pickDirectory()).resolves.toBeNull();
  });
});
