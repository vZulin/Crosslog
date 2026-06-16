import { bench, describe } from "vitest";
import { createSynchronizationPlan } from "../../packages/core/src/sync/synchronization-engine";

describe("synchronization", () => {
  bench("selects synchronized targets from large timestamped panes", () => {
    const panes = Array.from({ length: 4 }, (_, paneIndex) => ({
      paneId: `pane-${paneIndex}`,
      timeOffset: { days: 0, hours: 0, minutes: paneIndex, seconds: 0, milliseconds: 0 },
      lines: Array.from({ length: 25_000 }, (_, lineIndex) => ({
        lineNumber: lineIndex + 1,
        timestamp: new Date(Date.UTC(2026, 5, 16, 10, 0, lineIndex)),
      })),
    }));

    const plan = createSynchronizationPlan({
      enabled: true,
      anchorPaneId: "pane-0",
      anchorTimestamp: new Date(Date.UTC(2026, 5, 16, 10, 0, 12_000)),
      panes,
    });

    if (plan.targets.length !== 3) {
      throw new Error("Synchronization benchmark produced an invalid target count.");
    }
  });
});
