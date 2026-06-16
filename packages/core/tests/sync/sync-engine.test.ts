import { describe, expect, it } from "vitest";
import { createSynchronizationPlan } from "../../src/sync/synchronization-engine";

describe("synchronization engine", () => {
  it("moves synchronized panes to the greatest timestamp not after the anchor", () => {
    const plan = createSynchronizationPlan({
      enabled: true,
      anchorPaneId: "pane-a",
      anchorTimestamp: new Date("2026-06-16T10:00:02.000Z"),
      panes: [
        {
          paneId: "pane-a",
          timeOffset: zeroOffset(),
          lines: [{ lineNumber: 1, timestamp: new Date("2026-06-16T10:00:02.000Z") }],
        },
        {
          paneId: "pane-b",
          timeOffset: zeroOffset(),
          lines: [
            { lineNumber: 1, timestamp: new Date("2026-06-16T09:59:59.000Z") },
            { lineNumber: 2, timestamp: new Date("2026-06-16T10:00:01.000Z") },
            { lineNumber: 3, timestamp: new Date("2026-06-16T10:00:03.000Z") },
          ],
        },
      ],
    });

    expect(plan.targets).toEqual([
      {
        paneId: "pane-b",
        lineNumber: 2,
        timestamp: new Date("2026-06-16T10:00:01.000Z"),
      },
    ]);
  });

  it("excludes untimed panes and returns no targets when synchronization is disabled", () => {
    const disabled = createSynchronizationPlan({
      enabled: false,
      anchorPaneId: "pane-a",
      anchorTimestamp: new Date("2026-06-16T10:00:02.000Z"),
      panes: [],
    });

    const untimed = createSynchronizationPlan({
      enabled: true,
      anchorPaneId: "pane-a",
      anchorTimestamp: new Date("2026-06-16T10:00:02.000Z"),
      panes: [
        { paneId: "pane-a", timeOffset: zeroOffset(), lines: [] },
        { paneId: "pane-b", timeOffset: zeroOffset(), lines: [{ lineNumber: 1, timestamp: null }] },
      ],
    });

    expect(disabled.targets).toEqual([]);
    expect(untimed.targets).toEqual([]);
    expect(untimed.excludedPaneIds).toEqual(["pane-b"]);
  });

  it("applies per-pane offsets before selecting synchronized target lines", () => {
    const plan = createSynchronizationPlan({
      enabled: true,
      anchorPaneId: "pane-a",
      anchorTimestamp: new Date("2026-06-16T10:00:00.000Z"),
      panes: [
        {
          paneId: "pane-a",
          timeOffset: { ...zeroOffset(), minutes: 5 },
          lines: [{ lineNumber: 1, timestamp: new Date("2026-06-16T10:00:00.000Z") }],
        },
        {
          paneId: "pane-b",
          timeOffset: zeroOffset(),
          lines: [
            { lineNumber: 1, timestamp: new Date("2026-06-16T10:04:59.000Z") },
            { lineNumber: 2, timestamp: new Date("2026-06-16T10:05:01.000Z") },
          ],
        },
      ],
    });

    expect(plan.targets[0]?.lineNumber).toBe(1);
  });
});

function zeroOffset() {
  return { days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };
}
