import React from "react";
import { render } from "@testing-library/react";
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
});

const zeroOffset = { days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };
