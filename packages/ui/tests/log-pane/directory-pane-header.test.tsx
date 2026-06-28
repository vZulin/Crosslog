import React from "react";
import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createDirectoryFileEntry, createDirectorySource } from "@crosslog/core";
import { PaneHeader } from "../../src/log-pane/PaneHeader";
import { redesignedShellTestIds } from "../../src/app-shell/testIds";

describe("directory pane header", () => {
  it("renders directory and selected-file labels as separate header fields", () => {
    const { getByLabelText, getByRole, getByTestId } = render(
      <PaneHeader
        active={true}
        paneId="pane-directory"
        title="latest.log"
        timeOffset={zeroOffset}
        directorySource={createDirectorySource({
          id: "source-directory",
          directoryIdentity: { value: "source-directory", platform: "web" },
          displayName: "logs/2026",
          files: createDirectoryFiles(),
        })}
        onClose={vi.fn()}
      />,
    );

    expect(getByTestId(redesignedShellTestIds.paneHeaderDirectoryTitle).textContent).toBe("logs/2026");
    expect(getByTestId(redesignedShellTestIds.paneHeaderSelectedFile).textContent).toBe(
      "app-2026-06-16.log",
    );
    expect(getByRole("heading", { name: "app-2026-06-16.log" })).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.paneHeader).getAttribute("aria-current")).toBe("true");
    expect(getByTestId(redesignedShellTestIds.paneHeader).getAttribute("aria-label")).toContain(
      "logs/2026, selected file app-2026-06-16.log active pane",
    );
    expect(getByLabelText("Previous file in logs/2026").hasAttribute("disabled")).toBe(true);
    expect(getByLabelText("Next file in logs/2026").hasAttribute("disabled")).toBe(false);
  });

  it("navigates through icon-only previous and next controls", () => {
    const onNavigateDirectory = vi.fn();
    const { getByTestId } = render(
      <PaneHeader
        active={false}
        paneId="pane-directory"
        title="latest.log"
        timeOffset={zeroOffset}
        directorySource={createDirectorySource({
          id: "source-directory",
          directoryIdentity: { value: "source-directory", platform: "web" },
          displayName: "logs/2026",
          files: createDirectoryFiles(),
          currentFileId: "directory-file-2026-06-15",
        })}
        onClose={vi.fn()}
        onNavigateDirectory={onNavigateDirectory}
      />,
    );

    fireEvent.click(getByTestId(redesignedShellTestIds.paneHeaderDirectoryPrevious));
    fireEvent.click(getByTestId(redesignedShellTestIds.paneHeaderDirectoryNext));

    expect(onNavigateDirectory).toHaveBeenNthCalledWith(1, "pane-directory", "previous");
    expect(onNavigateDirectory).toHaveBeenNthCalledWith(2, "pane-directory", "next");
  });

  it("keeps long directory and file names truncatable inside the header", () => {
    const longDirectoryName = "logs/production/us-east/cluster-alpha/service-with-a-very-long-name";
    const longFileName = "service-with-a-very-long-name-2026-06-16T09-00-00.000Z-instance-123.log";
    const { getByTestId } = render(
      <PaneHeader
        active={false}
        paneId="pane-directory"
        title="latest.log"
        timeOffset={zeroOffset}
        directorySource={createDirectorySource({
          id: "source-directory",
          directoryIdentity: { value: "source-directory", platform: "web" },
          displayName: longDirectoryName,
          files: [
            createDirectoryFileEntry({
              identity: { value: "long-file", platform: "web" },
              name: longFileName,
              createdAt: new Date("2026-06-16T09:00:00.000Z"),
              sizeBytes: 4096,
            }),
          ],
        })}
        onClose={vi.fn()}
      />,
    );

    const directoryLabel = getByTestId(redesignedShellTestIds.paneHeaderDirectoryTitle);
    const selectedFileLabel = getByTestId(redesignedShellTestIds.paneHeaderSelectedFile);
    const header = getByTestId(redesignedShellTestIds.paneHeader);

    expect(directoryLabel.getAttribute("title")).toBe(longDirectoryName);
    expect(directoryLabel.className).toContain("crosslog-pane-header__directory");
    expect(selectedFileLabel.getAttribute("title")).toBe(longFileName);
    expect(selectedFileLabel.className).toContain("crosslog-pane-header__selected-file");
    expect(header.querySelector(".crosslog-directory-navigator")).toBeTruthy();
    expect(header.querySelector(".crosslog-pane-header__actions")).toBeTruthy();
  });

  it("keeps the empty-directory status inside the redesigned header area", () => {
    const { getByTestId, queryByTestId } = render(
      <PaneHeader
        active={false}
        paneId="pane-directory"
        title="logs/empty"
        timeOffset={zeroOffset}
        directorySource={createDirectorySource({
          id: "source-directory",
          directoryIdentity: { value: "source-directory", platform: "web" },
          displayName: "logs/2026",
          files: [],
        })}
        onClose={vi.fn()}
      />,
    );

    const header = getByTestId(redesignedShellTestIds.paneHeader);

    expect(within(header).getByRole("status", { name: "Empty directory logs/2026" }).textContent).toBe(
      "No top-level log files in logs/2026",
    );
    expect(queryByTestId(redesignedShellTestIds.paneHeaderDirectoryPrevious)).toBeNull();
    expect(queryByTestId(redesignedShellTestIds.paneHeaderDirectoryNext)).toBeNull();
  });
});

function createDirectoryFiles() {
  return [
    createDirectoryFileEntry({
      identity: { value: "directory-file-2026-06-16", platform: "web" },
      name: "app-2026-06-16.log",
      createdAt: new Date("2026-06-16T09:00:00.000Z"),
      sizeBytes: 4096,
    }),
    createDirectoryFileEntry({
      identity: { value: "directory-file-2026-06-15", platform: "web" },
      name: "app-2026-06-15.log",
      createdAt: new Date("2026-06-15T09:00:00.000Z"),
      sizeBytes: 4096,
    }),
    createDirectoryFileEntry({
      identity: { value: "directory-file-2026-06-14", platform: "web" },
      name: "app-2026-06-14.log",
      createdAt: new Date("2026-06-14T09:00:00.000Z"),
      sizeBytes: 4096,
    }),
  ];
}

const zeroOffset = { days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };
