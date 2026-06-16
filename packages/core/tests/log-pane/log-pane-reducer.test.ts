import { describe, expect, it } from "vitest";
import { createLogPane, createLogPaneState, logPaneReducer } from "../../src/log-pane/log-pane-reducer";

describe("log pane reducer", () => {
  it("adds panes and activates the newest pane", () => {
    const next = logPaneReducer(createLogPaneState(), {
      type: "addPane",
      pane: { title: "app.log" },
    });

    expect(next.panes).toHaveLength(1);
    expect(next.panes[0].title).toBe("app.log");
    expect(next.activePaneId).toBe(next.panes[0].id);
    expect(next.panes[0].active).toBe(true);
  });

  it("splits a pane while preserving independent pane identities", () => {
    const state = createLogPaneState([
      createLogPane({ id: "pane-a", title: "app.log", active: true, width: 800, status: "ready" }),
    ]);
    const next = logPaneReducer(state, {
      type: "splitPane",
      pane: { title: "service.log" },
    });

    expect(next.panes.map((pane) => pane.title)).toEqual(["app.log", "service.log"]);
    expect(next.panes.map((pane) => pane.width)).toEqual([400, 400]);
    expect(next.activePaneId).toBe("pane-2");
  });

  it("closes panes and redistributes width to the nearest neighbor", () => {
    const state = createLogPaneState([
      createLogPane({ id: "pane-a", title: "app.log", width: 500, status: "ready" }),
      createLogPane({ id: "pane-b", title: "service.log", width: 600, active: true, status: "ready" }),
      createLogPane({ id: "pane-c", title: "worker.log", width: 700, status: "ready" }),
    ]);
    const next = logPaneReducer(state, { type: "closePane", paneId: "pane-b" });

    expect(next.panes.map((pane) => pane.id)).toEqual(["pane-a", "pane-c"]);
    expect(next.panes[0].width).toBe(1100);
    expect(next.activePaneId).toBe("pane-c");
  });

  it("resizes adjacent panes without violating minimum widths", () => {
    const state = createLogPaneState([
      createLogPane({ id: "pane-a", width: 400, status: "ready" }),
      createLogPane({ id: "pane-b", width: 400, status: "ready" }),
    ]);
    const next = logPaneReducer(state, {
      type: "resizePane",
      leftPaneId: "pane-a",
      delta: 200,
    });

    expect(next.panes.map((pane) => pane.width)).toEqual([480, 320]);
  });

  it("tracks horizontal scrolling per pane", () => {
    const state = createLogPaneState([
      createLogPane({ id: "pane-a", status: "ready" }),
      createLogPane({ id: "pane-b", status: "ready" }),
    ]);
    const next = logPaneReducer(state, {
      type: "setHorizontalScroll",
      paneId: "pane-b",
      scrollLeft: 128,
    });

    expect(next.panes[0].horizontalScroll).toBe(0);
    expect(next.panes[1].horizontalScroll).toBe(128);
  });
});
