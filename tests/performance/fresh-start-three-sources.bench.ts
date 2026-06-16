import { bench, describe } from "vitest";
import {
  createDirectoryFileEntry,
  createDirectorySource,
  createSearchQuery,
  createSynchronizationPlan,
  directorySourceReducer,
  searchLogLines,
} from "../../packages/core/src";
import { createVisibleLogLineWindow } from "../../packages/ui/src/log-pane/VirtualLogViewport";

describe("fresh start three-source workflow", () => {
  bench("opens, searches, synchronizes, and renders three source panes", () => {
    const firstLines = createTimestampedLines("api", 8_000);
    const secondLines = createTimestampedLines("worker", 8_000);
    const thirdLines = createTimestampedLines("scheduler", 8_000);
    const directory = createDirectorySource({
      id: "release-directory",
      directoryIdentity: { value: "release-directory", platform: "web" },
      displayName: "release-directory",
      files: [
        createDirectoryFileEntry({
          identity: { value: "scheduler-1", platform: "web" },
          name: "scheduler-1.log",
          createdAt: new Date("2026-06-16T10:00:00.000Z"),
          sizeBytes: 1024,
        }),
        createDirectoryFileEntry({
          identity: { value: "scheduler-2", platform: "web" },
          name: "scheduler-2.log",
          createdAt: new Date("2026-06-16T10:01:00.000Z"),
          sizeBytes: 1024,
        }),
      ],
    });

    const selectedDirectory = directorySourceReducer(directory, { type: "navigate", direction: "next" });
    const search = searchLogLines(secondLines, createSearchQuery("target=release", "text", true));
    const timestamps = firstLines.map((_, index) => new Date(Date.UTC(2026, 5, 16, 10, 0, index)));
    const syncPlan = createSynchronizationPlan({
      enabled: true,
      anchorPaneId: "pane-api",
      anchorTimestamp: timestamps[4_000] ?? null,
      panes: [
        { paneId: "pane-api", lines: toSynchronizationLines(timestamps) },
        { paneId: "pane-worker", lines: toSynchronizationLines(timestamps) },
        { paneId: "pane-scheduler", lines: toSynchronizationLines(timestamps) },
      ],
    });
    const visibleWindows = [
      createVisibleLogLineWindow(firstLines, 120),
      createVisibleLogLineWindow(secondLines, 120),
      createVisibleLogLineWindow(thirdLines, 120),
    ];

    if (
      selectedDirectory.currentFileId !== "scheduler-2" ||
      search.matches.length !== 1 ||
      syncPlan.targets.length !== 2 ||
      visibleWindows.some((window) => window.length !== 120)
    ) {
      throw new Error("Fresh-start three-source workflow benchmark produced invalid state.");
    }
  });
});

function createTimestampedLines(sourceName: string, lineCount: number): readonly string[] {
  return Array.from({ length: lineCount }, (_, index) => {
    const marker = sourceName === "worker" && index === lineCount - 1 ? " target=release" : "";

    return `2026-06-16T10:00:${String(index % 60).padStart(2, "0")}.000Z ${sourceName} line=${index}${marker}`;
  });
}

function toSynchronizationLines(timestamps: readonly Date[]) {
  return timestamps.map((timestamp, index) => ({
    lineNumber: index + 1,
    timestamp,
  }));
}
