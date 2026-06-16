import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createLogPane } from "@crosslog/core";
import { PaneRail } from "../../src/pane-rail/PaneRail";

describe("pane rail layout", () => {
  it("renders ordered panes and creation controls", () => {
    const { getByLabelText, getAllByTestId } = render(
      <PaneRail
        panes={[
          { pane: createLogPane({ id: "pane-a", title: "app.log", status: "ready" }), lines: ["line a"] },
          {
            pane: createLogPane({ id: "pane-b", title: "service.log", status: "ready" }),
            lines: ["line b"],
          },
        ]}
        onAddPane={vi.fn()}
        onSplitPane={vi.fn()}
        onClosePane={vi.fn()}
        onActivatePane={vi.fn()}
        onResizePane={vi.fn()}
        onHorizontalScroll={vi.fn()}
      />,
    );

    expect(getAllByTestId("log-pane")).toHaveLength(2);
    expect(getByLabelText("Add pane")).toBeTruthy();
    expect(getByLabelText("Split active pane")).toBeTruthy();
  });

  it("routes close, resize, and horizontal scroll events", () => {
    const onClosePane = vi.fn();
    const onResizePane = vi.fn();
    const onHorizontalScroll = vi.fn();
    const { getByLabelText } = render(
      <PaneRail
        panes={[
          { pane: createLogPane({ id: "pane-a", title: "app.log", status: "ready" }), lines: ["line a"] },
          {
            pane: createLogPane({ id: "pane-b", title: "service.log", status: "ready" }),
            lines: ["line b"],
          },
        ]}
        onAddPane={vi.fn()}
        onSplitPane={vi.fn()}
        onClosePane={onClosePane}
        onActivatePane={vi.fn()}
        onResizePane={onResizePane}
        onHorizontalScroll={onHorizontalScroll}
      />,
    );

    fireEvent.click(getByLabelText("Close pane app.log"));
    fireEvent.click(getByLabelText("Move boundary after app.log right"));
    const scroller = getByLabelText("Horizontal log scroller for service.log");
    scroller.scrollLeft = 96;
    fireEvent.scroll(scroller);

    expect(onClosePane).toHaveBeenCalledWith("pane-a");
    expect(onResizePane).toHaveBeenCalledWith("pane-a", 80);
    expect(onHorizontalScroll).toHaveBeenCalledWith("pane-b", 96);
  });
});
