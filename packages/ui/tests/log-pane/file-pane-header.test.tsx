import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PaneHeader } from "../../src/log-pane/PaneHeader";
import { redesignedShellTestIds } from "../../src/app-shell/testIds";

describe("file pane header", () => {
  it("renders file pane identity and target controls without directory navigation", () => {
    const longFileName =
      "prod-us-east-very-long-service-name-with-build-number-2026-06-27T09-20-11.123Z.log";
    const { getByLabelText, getByTestId, getByTitle, queryByTestId } = render(
      <PaneHeader
        active={true}
        lifecycleState={{
          live: true,
          deleted: false,
          replaced: false,
          monitoringUnsupported: false,
          errorMessage: null,
        }}
        paneId="pane-file"
        title={longFileName}
        timeOffset={zeroOffset}
        onClose={vi.fn()}
      />,
    );

    const header = getByTestId(redesignedShellTestIds.paneHeader);

    expect(header.getAttribute("aria-current")).toBe("true");
    expect(getByTitle(longFileName).className).toContain("crosslog-pane-header__title");
    expect(getByTestId(redesignedShellTestIds.paneHeaderLive).querySelector(".crosslog-pane-header__live-dot")).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.paneHeaderOffset).textContent).toContain("0 ms");
    expect(getByLabelText(`Search in ${longFileName}`)).toBeTruthy();
    expect(getByLabelText(`Close pane ${longFileName}`)).toBeTruthy();
    expect(queryByTestId(redesignedShellTestIds.paneHeaderDirectoryPrevious)).toBeNull();
    expect(queryByTestId(redesignedShellTestIds.paneHeaderDirectoryNext)).toBeNull();
  });

  it("starts pane reorder from the file header title area", () => {
    const onReorderDragStart = vi.fn();
    const { getByRole } = render(
      <PaneHeader
        active={true}
        paneId="pane-file"
        title="app.log"
        timeOffset={zeroOffset}
        onClose={vi.fn()}
        onReorderDragStart={onReorderDragStart}
      />,
    );

    fireEvent.pointerDown(getByRole("heading", { name: "app.log" }), { button: 0, clientX: 42 });

    expect(onReorderDragStart).toHaveBeenCalledTimes(1);
  });

  it("does not start pane reorder from file header controls", () => {
    const onClose = vi.fn();
    const onOpenSearch = vi.fn();
    const onOpenTimeOffset = vi.fn();
    const onReorderDragStart = vi.fn();
    const { getByLabelText } = render(
      <PaneHeader
        active={true}
        paneId="pane-file"
        title="app.log"
        timeOffset={zeroOffset}
        onClose={onClose}
        onOpenSearch={onOpenSearch}
        onOpenTimeOffset={onOpenTimeOffset}
        onReorderDragStart={onReorderDragStart}
      />,
    );

    fireEvent.pointerDown(getByLabelText("Time offset for app.log: 0 ms"), { button: 0, clientX: 42 });
    fireEvent.pointerDown(getByLabelText("Search in app.log"), { button: 0, clientX: 42 });
    fireEvent.pointerDown(getByLabelText("Close pane app.log"), { button: 0, clientX: 42 });

    expect(onReorderDragStart).not.toHaveBeenCalled();
  });
});

const zeroOffset = { days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };
