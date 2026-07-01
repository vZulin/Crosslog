import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createLogPane } from "@crosslog/core";
import { StatusBar } from "../../src/app-shell/StatusBar";
import { PaneRail } from "../../src/pane-rail/PaneRail";
import { redesignedShellTestIds } from "../../src/app-shell/testIds";

describe("redesigned shell responsive contracts", () => {
  it("keeps long pane labels separate from header controls", () => {
    const longTitle =
      "prod-us-east-very-long-service-name-with-build-number-2026-06-27T09-20-11.123Z.log";
    const { getByLabelText, getByTestId, getByTitle } = render(
      <PaneRail
        panes={[
          {
            pane: createLogPane({ id: "pane-long", title: longTitle, status: "ready", width: 420 }),
            lines: ["2026-06-27T09:20:11.123Z INFO long label smoke test"],
          },
        ]}
        onClosePane={vi.fn()}
        onActivatePane={vi.fn()}
        onResizePane={vi.fn()}
        onHorizontalScroll={vi.fn()}
      />,
    );

    expect(getByTitle(longTitle).className).toContain("crosslog-pane-header__title");
    const header = getByTestId(redesignedShellTestIds.paneHeader);
    const offset = getByTestId(redesignedShellTestIds.paneHeaderOffset);
    const find = getByTestId(redesignedShellTestIds.paneHeaderSearch);
    const close = getByTestId(redesignedShellTestIds.paneHeaderClose);

    expect(header.querySelector(".crosslog-pane-header__identity")).toBeTruthy();
    expect(header.querySelector(".crosslog-pane-header__actions")).toBeTruthy();
    expect(offset.compareDocumentPosition(find) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(find.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(getByLabelText(`Close pane ${longTitle}`)).toBeTruthy();
  });

  it("truncates long status labels without hiding pane count or sync state", () => {
    const longActiveSource =
      "directory-with-a-very-long-name/currently-selected-log-file-with-extra-context-and-timestamp.log";
    const { getByText, getByTitle } = render(
      <StatusBar
        activeSourceLabel={longActiveSource}
        paneCount={12}
        syncEnabled={false}
        message="2 untimed panes excluded"
      />,
    );

    expect(getByText("12 panes")).toBeTruthy();
    expect(getByText("Sync off")).toBeTruthy();
    expect(getByTitle(longActiveSource).className).toContain("crosslog-status-bar__active-source");
  });
});
