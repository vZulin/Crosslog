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

  it("positions the copy action beside the context-menu pointer", () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    const { getByRole } = render(
      <LogTextSelection title="app.log" lines={["first", "second"]} clipboard={clipboard} />,
    );
    const group = getByRole("group", { name: "Log text actions for app.log" });

    stubElementRect(group, { left: 10, top: 20, width: 400, height: 240 });
    fireEvent.contextMenu(group, { clientX: 110, clientY: 90 });

    const menuItem = getByRole("menuitem", { name: "Copy selected text" });

    expect(menuItem.style.left).toBe("100px");
    expect(menuItem.style.top).toBe("70px");
  });

  it("keeps the copy action inside the viewport boundary and relocates on another right click", () => {
    const { getByRole } = render(<LogTextSelection title="app.log" lines={["first", "second"]} />);
    const group = getByRole("group", { name: "Log text actions for app.log" });

    stubElementRect(group, { left: 0, top: 0, width: 190, height: 80 });
    fireEvent.contextMenu(group, { clientX: 184, clientY: 74 });

    const menuItem = getByRole("menuitem", { name: "Copy selected text" });

    expect(menuItem.style.left).toBe("26px");
    expect(menuItem.style.top).toBe("39px");

    fireEvent.contextMenu(group, { clientX: 40, clientY: 18 });

    expect(menuItem.style.left).toBe("26px");
    expect(menuItem.style.top).toBe("18px");
  });

  it("dismisses the copy action on outside left click", () => {
    const { getByRole, queryByRole } = render(
      <LogTextSelection title="app.log" lines={["first", "second"]} />,
    );
    const group = getByRole("group", { name: "Log text actions for app.log" });

    stubElementRect(group, { left: 0, top: 0, width: 320, height: 160 });
    fireEvent.contextMenu(group, { clientX: 80, clientY: 40 });
    expect(getByRole("menuitem", { name: "Copy selected text" })).toBeTruthy();

    fireEvent.pointerDown(group, { button: 0 });

    expect(queryByRole("menuitem", { name: "Copy selected text" })).toBeNull();
  });

  it("copies without showing product-visible copied feedback", async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    const onCopied = vi.fn();
    const { getByRole, queryByRole } = render(
      <LogTextSelection
        title="app.log"
        lines={["first", "second"]}
        clipboard={clipboard}
        onCopied={onCopied}
      />,
    );
    const group = getByRole("group", { name: "Log text actions for app.log" });

    stubElementRect(group, { left: 0, top: 0, width: 320, height: 160 });
    fireEvent.contextMenu(group, { clientX: 80, clientY: 40 });
    fireEvent.click(getByRole("menuitem", { name: "Copy selected text" }));

    await waitFor(() => expect(onCopied).toHaveBeenCalledWith("app.log"));
    expect(clipboard.writeText).toHaveBeenCalledWith("first\nsecond");
    expect(queryByRole("status", { name: /copied/i })).toBeNull();
    expect(queryByRole("menuitem", { name: "Copy selected text" })).toBeNull();
  });
});

function stubElementRect(
  element: HTMLElement,
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
): void {
  const completeRect = {
    ...rect,
    x: rect.left,
    y: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    toJSON: () => ({}),
  } as DOMRect;

  vi.spyOn(element, "getBoundingClientRect").mockReturnValue(completeRect);
}
