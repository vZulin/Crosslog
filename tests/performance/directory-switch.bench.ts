import { bench, describe } from "vitest";
import {
  createDirectoryFileEntry,
  createDirectorySource,
  directorySourceReducer,
} from "../../packages/core/src";

describe("directory switching", () => {
  bench("moves through a large directory navigation index", () => {
    const source = createDirectorySource({
      id: "large-directory",
      directoryIdentity: { value: "large-directory", platform: "web" },
      displayName: "large-directory",
      files: Array.from({ length: 10_000 }, (_, index) =>
        createDirectoryFileEntry({
          identity: { value: `file-${index}`, platform: "web" },
          name: `app-${String(index).padStart(5, "0")}.log`,
          createdAt: new Date(Date.UTC(2026, 5, 16, 0, 0, index)),
          sizeBytes: 1024,
        }),
      ),
    });

    let current = source;

    for (let index = 0; index < 1_000; index += 1) {
      current = directorySourceReducer(current, { type: "navigate", direction: "next" });
    }

    if (current.currentFileId === source.currentFileId) {
      throw new Error("Directory switch benchmark did not move the current file.");
    }
  });
});
