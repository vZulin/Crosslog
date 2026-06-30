import { describe, expect, it } from "vitest";
import { createSynchronizationPlan } from "../../src/sync/synchronization-engine";
import { validateTimeOffsetDraft } from "../../src/sync/time-offset";

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

  it("uses only a valid applied offset when selecting synchronized target lines", () => {
    const invalidDraft = validateTimeOffsetDraft({
      days: "0",
      hours: "0",
      minutes: "60",
      seconds: "0",
      milliseconds: "0",
    });
    const validDraft = validateTimeOffsetDraft({
      days: "0",
      hours: "0",
      minutes: "1",
      seconds: "",
      milliseconds: "",
    });

    expect(invalidDraft.valid).toBe(false);
    expect(validDraft.valid).toBe(true);

    if (!validDraft.valid) {
      throw new Error("Expected the one-minute draft to be valid.");
    }

    const plan = createSynchronizationPlan({
      enabled: true,
      anchorPaneId: "pane-a",
      anchorTimestamp: new Date("2026-06-16T10:00:00.000Z"),
      panes: [
        {
          paneId: "pane-a",
          timeOffset: validDraft.offset,
          lines: [{ lineNumber: 1, timestamp: new Date("2026-06-16T10:00:00.000Z") }],
        },
        {
          paneId: "pane-b",
          timeOffset: zeroOffset(),
          lines: [
            { lineNumber: 60, timestamp: new Date("2026-06-16T10:00:59.000Z") },
            { lineNumber: 61, timestamp: new Date("2026-06-16T10:01:00.000Z") },
            { lineNumber: 62, timestamp: new Date("2026-06-16T10:01:01.000Z") },
          ],
        },
      ],
    });

    expect(plan.targets).toEqual([
      {
        paneId: "pane-b",
        lineNumber: 61,
        timestamp: new Date("2026-06-16T10:01:00.000Z"),
      },
    ]);
  });
});

function zeroOffset() {
  return { days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };
}
