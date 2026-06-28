import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LogTextSelection, copySelectedLogText, formatSelectedLogText } from "../../src/log-pane/LogTextSelection";

describe("log text copy", () => {
  it("formats selected log lines without markup", () => {
    expect(formatSelectedLogText(["<b>unsafe</b>", "plain", "tail"], [0, 2])).toBe("<b>unsafe</b>\ntail");
  });

  it("writes selected log text to the provided clipboard", async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };

    await expect(copySelectedLogText(["first", "second"], [1], clipboard)).resolves.toBe("second");
    expect(clipboard.writeText).toHaveBeenCalledWith("second");
  });

  it("offers copy through the pane context menu", async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    const { getByRole, getByText } = render(
      <LogTextSelection title="app.log" lines={["first", "second"]} clipboard={clipboard} />,
    );

    fireEvent.contextMenu(getByRole("group", { name: "Log text actions for app.log" }));
    fireEvent.click(getByRole("menuitem", { name: "Copy selected text" }));

    await waitFor(() => expect(getByText("Copied")).toBeTruthy());
    expect(clipboard.writeText).toHaveBeenCalledWith("first\nsecond");
  });
});
