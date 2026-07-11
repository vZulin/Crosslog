import React from "react";
import { act, fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createLogPane } from "@crosslog/core";
import { PaneRail } from "../../src/pane-rail/PaneRail";

describe("pane rail layout", () => {
  it("renders ordered panes inside the redesigned workspace", () => {
    const { getAllByTestId, queryByTestId } = render(
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
    expect(queryByTestId("workspace-scrollbar")).toBeNull();
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

  it("reorders panes by dragging a non-control pane header region across another midpoint", async () => {
    const onReorderPane = vi.fn();
    const { getAllByTestId } = render(
      <PaneRail
        panes={[
          { pane: createLogPane({ id: "pane-a", title: "app.log", width: 420, status: "ready" }), lines: ["line a"] },
          {
            pane: createLogPane({ id: "pane-b", title: "service.log", width: 420, status: "ready" }),
            lines: ["line b"],
          },
          {
            pane: createLogPane({ id: "pane-c", title: "worker.log", width: 420, status: "ready" }),
            lines: ["line c"],
          },
        ]}
        onClosePane={vi.fn()}
        onActivatePane={vi.fn()}
        onResizePane={vi.fn()}
        onHorizontalScroll={vi.fn()}
        onReorderPane={onReorderPane}
      />,
    );
    const panes = getAllByTestId("log-pane");
    panes.forEach((pane, index) => {
      mockElementRect(pane, {
        left: index * 100,
        right: index * 100 + 100,
        width: 100,
      });
    });
    const appHeader = within(panes[0]).getByTestId("pane-header");

    await act(async () => {
      dispatchPointerLikeEvent(appHeader, "pointerdown", 50);
    });
    await act(async () => {
      dispatchPointerLikeEvent(window, "pointermove", 175);
      dispatchPointerLikeEvent(window, "pointerup", 175);
    });

    expect(onReorderPane).toHaveBeenCalledWith("pane-a", 1);
  });

  it("keeps header controls from starting pane reorder drags", async () => {
    const onReorderPane = vi.fn();
    const { getAllByTestId } = render(
      <PaneRail
        panes={[
          { pane: createLogPane({ id: "pane-a", title: "app.log", width: 420, status: "ready" }), lines: ["line a"] },
          {
            pane: createLogPane({ id: "pane-b", title: "service.log", width: 420, status: "ready" }),
            lines: ["line b"],
          },
        ]}
        onClosePane={vi.fn()}
        onActivatePane={vi.fn()}
        onResizePane={vi.fn()}
        onHorizontalScroll={vi.fn()}
        onReorderPane={onReorderPane}
      />,
    );
    const panes = getAllByTestId("log-pane");
    panes.forEach((pane, index) => {
      mockElementRect(pane, {
        left: index * 100,
        right: index * 100 + 100,
        width: 100,
      });
    });
    const appPane = within(panes[0]);

    for (const control of [
      appPane.getByLabelText("Time offset for app.log: 0 ms"),
      appPane.getByLabelText("Search in app.log"),
      appPane.getByLabelText("Close pane app.log"),
    ]) {
      await act(async () => {
        dispatchPointerLikeEvent(control, "pointerdown", 50);
      });
      await act(async () => {
        dispatchPointerLikeEvent(window, "pointermove", 175);
        dispatchPointerLikeEvent(window, "pointerup", 175);
      });
    }

    expect(onReorderPane).not.toHaveBeenCalled();
  });

  it("publishes a header reorder handle without overlapping pane actions", () => {
    const { getByLabelText } = render(
      <PaneRail
        panes={[
          { pane: createLogPane({ id: "pane-a", title: "app.log", width: 520, status: "ready" }), lines: ["line a"] },
        ]}
        onClosePane={vi.fn()}
        onActivatePane={vi.fn()}
        onResizePane={vi.fn()}
        onHorizontalScroll={vi.fn()}
        onReorderPane={vi.fn()}
      />,
    );

    expect(getByLabelText("Reorder pane app.log").classList.contains("crosslog-pane-header__drag-handle")).toBe(true);
    expect(getByLabelText("Time offset for app.log: 0 ms").classList.contains("crosslog-pane-header__offset-tag")).toBe(
      true,
    );
    expect(getByLabelText("Search in app.log").classList.contains("crosslog-pane-header__find-button")).toBe(true);
    expect(getByLabelText("Close pane app.log").classList.contains("crosslog-pane-header__close")).toBe(true);
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

function mockElementRect(
  element: Element,
  rect: Pick<DOMRect, "left" | "right" | "width">,
): void {
  element.getBoundingClientRect = () => ({
    bottom: 100,
    height: 100,
    top: 0,
    x: rect.left,
    y: 0,
    left: rect.left,
    right: rect.right,
    width: rect.width,
    toJSON: () => ({}),
  });
}
