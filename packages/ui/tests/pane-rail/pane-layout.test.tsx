import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createLogPane } from "@crosslog/core";
import { PaneRail } from "../../src/pane-rail/PaneRail";

describe("pane rail layout", () => {
  it("renders ordered panes inside the redesigned workspace", () => {
    const { getAllByTestId, getByTestId } = render(
      <PaneRail
        panes={[
          { pane: createLogPane({ id: "pane-a", title: "app.log", status: "ready" }), lines: ["line a"] },
          {
            pane: createLogPane({ id: "pane-b", title: "service.log", status: "ready" }),
            lines: ["line b"],
          },
        ]}
        onClosePane={vi.fn()}
        onActivatePane={vi.fn()}
        onResizePane={vi.fn()}
        onHorizontalScroll={vi.fn()}
      />,
    );

    expect(getAllByTestId("log-pane")).toHaveLength(2);
    expect(getByTestId("workspace-scrollbar")).toBeTruthy();
  });

  it("routes close, resize, and horizontal scroll events", async () => {
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
        onClosePane={onClosePane}
        onActivatePane={vi.fn()}
        onResizePane={onResizePane}
        onHorizontalScroll={onHorizontalScroll}
      />,
    );

    fireEvent.click(getByLabelText("Close pane app.log"));
    const boundary = getByLabelText("Resize boundary after app.log");

    await act(async () => {
      dispatchPointerLikeEvent(boundary, "pointerdown", 100);
    });
    await act(async () => {
      dispatchPointerLikeEvent(window, "pointermove", 180);
      dispatchPointerLikeEvent(window, "pointerup", 180);
    });
    const scroller = getByLabelText("Horizontal log scroller for service.log");
    scroller.scrollLeft = 96;
    fireEvent.scroll(scroller);

    expect(onClosePane).toHaveBeenCalledWith("pane-a");
    expect(onResizePane).toHaveBeenCalledWith("pane-a", 80);
    expect(onHorizontalScroll).toHaveBeenCalledWith("pane-b", 96);
  });

  it("keeps resize boundaries as accessible separators without obsolete plus or minus controls", () => {
    const onResizePane = vi.fn();
    const { getByLabelText, queryByLabelText } = render(
      <PaneRail
        panes={[
          { pane: createLogPane({ id: "pane-a", title: "app.log", width: 520, status: "ready" }), lines: ["line a"] },
          {
            pane: createLogPane({ id: "pane-b", title: "service.log", width: 520, status: "ready" }),
            lines: ["line b"],
          },
        ]}
        onClosePane={vi.fn()}
        onActivatePane={vi.fn()}
        onResizePane={onResizePane}
        onHorizontalScroll={vi.fn()}
      />,
    );

    const boundary = getByLabelText("Resize boundary after app.log");

    expect(boundary.getAttribute("role")).toBe("separator");
    expect(boundary.getAttribute("aria-orientation")).toBe("vertical");
    expect(boundary.getAttribute("aria-valuenow")).toBe("520");
    expect(queryByLabelText("Move boundary after app.log left")).toBeNull();
    expect(queryByLabelText("Move boundary after app.log right")).toBeNull();

    fireEvent.keyDown(boundary, { key: "ArrowLeft" });
    fireEvent.keyDown(boundary, { key: "ArrowRight", shiftKey: true });

    expect(onResizePane).toHaveBeenNthCalledWith(1, "pane-a", -40);
    expect(onResizePane).toHaveBeenNthCalledWith(2, "pane-a", 80);
  });
});

function dispatchPointerLikeEvent(target: EventTarget, type: string, clientX: number): void {
  target.dispatchEvent(
    new MouseEvent(type, {
      bubbles: true,
      button: 0,
      clientX,
    }),
  );
}
