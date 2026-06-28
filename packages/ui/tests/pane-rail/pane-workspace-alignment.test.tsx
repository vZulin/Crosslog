import { describe, expect, it } from "vitest";
import { computePaneWorkspaceLayout } from "../../src/pane-rail/usePaneWorkspaceLayout";

describe("pane workspace alignment", () => {
  it("fills the right edge when desired pane widths fit inside the workspace", () => {
    const layout = computePaneWorkspaceLayout(
      [
        { paneId: "pane-a", desiredWidth: 320 },
        { paneId: "pane-b", desiredWidth: 320 },
      ],
      900,
    );

    expect(layout.overflowing).toBe(false);
    expect(layout.totalDesiredWidth).toBe(640);
    expect(layout.totalRenderedWidth).toBe(900);
    expect(layout.renderedWidths.map((entry) => entry.renderedWidth)).toEqual([450, 450]);
  });

  it("keeps workspace overflow only when desired widths exceed the available width", () => {
    const fittingLayout = computePaneWorkspaceLayout(
      [
        { paneId: "pane-a", desiredWidth: 440 },
        { paneId: "pane-b", desiredWidth: 440 },
      ],
      880,
    );
    const overflowingLayout = computePaneWorkspaceLayout(
      [
        { paneId: "pane-a", desiredWidth: 520 },
        { paneId: "pane-b", desiredWidth: 520 },
        { paneId: "pane-c", desiredWidth: 520 },
      ],
      1200,
    );

    expect(fittingLayout.overflowing).toBe(false);
    expect(fittingLayout.totalRenderedWidth).toBe(880);
    expect(overflowingLayout.overflowing).toBe(true);
    expect(overflowingLayout.totalRenderedWidth).toBe(1560);
  });

  it("does not replace desired pane widths with computed fill widths", () => {
    const panes = [
      { paneId: "pane-a", desiredWidth: 480 },
      { paneId: "pane-b", desiredWidth: 520 },
    ] as const;

    const layout = computePaneWorkspaceLayout(panes, 1200);

    expect(layout.renderedWidths.map((entry) => entry.desiredWidth)).toEqual([480, 520]);
    expect(layout.renderedWidths.map((entry) => entry.renderedWidth)).toEqual([580, 620]);
    expect(panes.map((entry) => entry.desiredWidth)).toEqual([480, 520]);
  });
});
