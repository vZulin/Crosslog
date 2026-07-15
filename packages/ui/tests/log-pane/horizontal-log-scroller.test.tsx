import React from "react";
import { act } from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HorizontalLogScroller } from "../../src/log-pane/HorizontalLogScroller";

describe("horizontal log scroller", () => {
  it("keeps horizontal wheel input pane-local and updates scrollLeft", async () => {
    const onScrollLeftChange = vi.fn();
    const { getByRole } = render(
      <HorizontalLogScroller
        title="app.log"
        scrollLeft={0}
        contentWidth={1_200}
        onScrollLeftChange={onScrollLeftChange}
      >
        <div>log content</div>
      </HorizontalLogScroller>,
    );
    const scroller = getByRole("region", { name: "Horizontal log scroller for app.log" });

    mockHorizontalScrollMetrics(scroller, { clientWidth: 320, scrollWidth: 1_200 });
    const wheelEvent = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaX: 96,
    });

    act(() => {
      scroller.dispatchEvent(wheelEvent);
    });

    expect(wheelEvent.defaultPrevented).toBe(true);
    expect(scroller.scrollLeft).toBe(96);
    await waitFor(() => expect(onScrollLeftChange).toHaveBeenLastCalledWith(96));
  });

  it("treats shift-wheel as horizontal scrolling", async () => {
    const onScrollLeftChange = vi.fn();
    const { getByRole } = render(
      <HorizontalLogScroller
        title="service.log"
        scrollLeft={0}
        contentWidth={1_200}
        onScrollLeftChange={onScrollLeftChange}
      >
        <div>log content</div>
      </HorizontalLogScroller>,
    );
    const scroller = getByRole("region", { name: "Horizontal log scroller for service.log" });

    mockHorizontalScrollMetrics(scroller, { clientWidth: 320, scrollWidth: 1_200 });
    const wheelEvent = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 120,
      shiftKey: true,
    });

    act(() => {
      scroller.dispatchEvent(wheelEvent);
    });

    expect(wheelEvent.defaultPrevented).toBe(true);
    expect(scroller.scrollLeft).toBe(120);
    await waitFor(() => expect(onScrollLeftChange).toHaveBeenLastCalledWith(120));
  });
});

function mockHorizontalScrollMetrics(
  element: HTMLElement,
  metrics: { readonly clientWidth: number; readonly scrollWidth: number },
): void {
  Object.defineProperty(element, "clientWidth", { configurable: true, value: metrics.clientWidth });
  Object.defineProperty(element, "scrollWidth", { configurable: true, value: metrics.scrollWidth });
}
