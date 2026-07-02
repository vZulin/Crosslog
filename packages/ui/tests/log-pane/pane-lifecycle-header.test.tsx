import React from "react";
import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { emptySearchState, type LogPane as LogPaneModel } from "@crosslog/core";
import { LogPane } from "../../src/log-pane/LogPane";
import { PaneHeader } from "../../src/log-pane/PaneHeader";
import { VirtualLogViewport, inferLogLineSeverity } from "../../src/log-pane/VirtualLogViewport";
import { redesignedShellTestIds } from "../../src/app-shell/testIds";

describe("pane lifecycle header", () => {
  it("renders a live indicator in the redesigned pane header", () => {
    const { getByRole, getByTestId } = render(
      <PaneHeader
        active={true}
        lifecycleState={{
          live: true,
          deleted: false,
          replaced: false,
          monitoringUnsupported: false,
          errorMessage: null,
        }}
        paneId="pane-app"
        title="app.log"
        timeOffset={zeroOffset}
        onClose={vi.fn()}
      />,
    );

    expect(getByTestId(redesignedShellTestIds.paneHeaderLifecycle).textContent).toBe("Live");
    expect(getByTestId(redesignedShellTestIds.paneHeaderLive).querySelector(".crosslog-pane-header__live-dot")).toBeTruthy();
    expect(getByRole("status", { name: "File state for app.log: Live" })).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.paneHeader).getAttribute("aria-label")).toContain(
      "file state Live",
    );
  });

  it("renders deleted and replaced indicators without removing pane controls", () => {
    const { getByLabelText, getByRole, getByTestId, rerender } = render(
      <PaneHeader
        active={false}
        lifecycleState={{
          live: false,
          deleted: true,
          replaced: false,
          monitoringUnsupported: false,
          errorMessage: null,
        }}
        paneId="pane-app"
        title="app.log"
        timeOffset={zeroOffset}
        onClose={vi.fn()}
      />,
    );

    expect(getByTestId(redesignedShellTestIds.paneHeaderDeleted).textContent).toBe("Deleted");
    expect(getByRole("status", { name: "File state for app.log: Deleted" })).toBeTruthy();
    expect(getByLabelText("Search in app.log")).toBeTruthy();

    rerender(
      <PaneHeader
        active={false}
        lifecycleState={{
          live: true,
          deleted: false,
          replaced: true,
          monitoringUnsupported: false,
          errorMessage: null,
        }}
        paneId="pane-app"
        title="app.log"
        timeOffset={zeroOffset}
        onClose={vi.fn()}
      />,
    );

    expect(getByTestId(redesignedShellTestIds.paneHeaderReplaced).textContent).toBe("Replaced");
    expect(getByTestId(redesignedShellTestIds.paneHeaderLifecycle).textContent).toBe("Replaced, Live");
    expect(getByRole("status", { name: "File state for app.log: Replaced, Live" })).toBeTruthy();
  });

  it("lets lifecycle header badges remain non-control reorder origins", () => {
    const onReorderDragStart = vi.fn();
    const { getByTestId } = render(
      <PaneHeader
        active={false}
        lifecycleState={{
          live: false,
          deleted: true,
          replaced: false,
          monitoringUnsupported: false,
          errorMessage: null,
        }}
        paneId="pane-app"
        title="app.log"
        timeOffset={zeroOffset}
        onClose={vi.fn()}
        onReorderDragStart={onReorderDragStart}
      />,
    );

    fireEvent.pointerDown(getByTestId(redesignedShellTestIds.paneHeaderDeleted), {
      button: 0,
      clientX: 42,
    });

    expect(onReorderDragStart).toHaveBeenCalledTimes(1);
  });

  it("hides unsupported monitoring while keeping pane-local errors as header states", () => {
    const { getByRole, getByTestId, queryByRole, queryByTestId, rerender } = render(
      <PaneHeader
        active={false}
        lifecycleState={{
          live: false,
          deleted: false,
          replaced: false,
          monitoringUnsupported: true,
          errorMessage: null,
        }}
        paneId="pane-app"
        title="app.log"
        timeOffset={zeroOffset}
        onClose={vi.fn()}
      />,
    );

    expect(queryByTestId(redesignedShellTestIds.paneHeaderMonitoringUnsupported)).toBeNull();
    expect(queryByRole("status", { name: "File state for app.log: Monitoring unavailable" })).toBeNull();

    rerender(
      <PaneHeader
        active={false}
        lifecycleState={{
          live: false,
          deleted: false,
          replaced: false,
          monitoringUnsupported: false,
          errorMessage: "Permission denied",
        }}
        paneId="pane-app"
        title="app.log"
        timeOffset={zeroOffset}
        onClose={vi.fn()}
      />,
    );

    expect(getByTestId(redesignedShellTestIds.paneHeaderError).getAttribute("title")).toBe(
      "Permission denied",
    );
    expect(getByRole("status", { name: "File state for app.log: Error" })).toBeTruthy();
  });

  it("keeps deleted file content visible and searchable below the redesigned header", () => {
    const { getByText, getByTestId } = render(
      <LogPane
        pane={createPane({ status: "deleted" })}
        lines={["retained line after delete"]}
        lifecycleState={{
          live: false,
          deleted: true,
          replaced: false,
          monitoringUnsupported: false,
          errorMessage: null,
        }}
        onActivate={vi.fn()}
        onClose={vi.fn()}
        onHorizontalScroll={vi.fn()}
      />,
    );

    const pane = getByTestId(redesignedShellTestIds.logPane);

    expect(within(pane).getByTestId(redesignedShellTestIds.paneHeaderDeleted)).toBeTruthy();
    expect(within(pane).queryByTestId(redesignedShellTestIds.obsoletePaneReadyFooter)).toBeNull();
    expect(pane.querySelector(".crosslog-pane-status")).toBeNull();
    expect(within(pane).getByTestId(redesignedShellTestIds.paneDeletedStatus).textContent).toBe(
      "app.log was deleted. Loaded content is retained.",
    );
    expect(getByText("retained line after delete")).toBeTruthy();
  });

  it("styles log rows by severity while keeping raw log text inert", () => {
    const unsafeLine = '<script>alert("x")</script> ERROR raw text';
    const { container, getByText } = render(<VirtualLogViewport title="app.log" lines={[unsafeLine]} />);
    const row = container.querySelector(".crosslog-log-viewport__row");

    expect(inferLogLineSeverity("2026-06-16 WARN slow response")).toBe("warn");
    expect(row?.getAttribute("data-severity")).toBe("error");
    expect(getByText(unsafeLine)).toBeTruthy();
    expect(container.querySelector("script")).toBeNull();
  });
});

function createPane(overrides: Partial<LogPaneModel> = {}): LogPaneModel {
  return {
    id: "pane-app",
    sourceRef: "source-app",
    title: "app.log",
    active: true,
    width: 520,
    horizontalScroll: 0,
    searchState: emptySearchState,
    syncEnabled: true,
    timeOffset: zeroOffset,
    status: "ready",
    ...overrides,
  };
}

const zeroOffset = { days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };
