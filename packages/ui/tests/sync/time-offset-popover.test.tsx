import React from "react";
import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TimeOffsetPopover } from "../../src/sync/TimeOffsetPopover";
import { redesignedShellTestIds } from "../../src/app-shell/testIds";

describe("redesigned time offset popover", () => {
  it("keeps edits as draft values until apply", () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    const { getByRole, getByTestId } = render(
      <TimeOffsetPopover
        title="app.log"
        value={{ days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }}
        onApply={onApply}
        onClose={onClose}
      />,
    );

    expect(getByRole("dialog", { name: "Time offset for app.log" })).toBeTruthy();
    expect(within(getByTestId(redesignedShellTestIds.timeOffsetPopover)).getByRole("heading", {
      name: "Time Offset",
    })).toBeTruthy();
    expect(within(getByTestId(redesignedShellTestIds.timeOffsetPopover)).getByTitle("app.log").className).toContain(
      "crosslog-time-offset-popover__source",
    );
    expect(getByTestId(redesignedShellTestIds.timeOffsetPopover).classList.contains("crosslog-time-offset-popover")).toBe(
      true,
    );
    expect(within(getByTestId(redesignedShellTestIds.timeOffsetPopover)).queryByRole("button", {
      name: "Close time offset for app.log",
    })).toBeNull();
    for (const label of ["Days", "Hours", "Min", "Sec", "Ms"]) {
      expect(within(getByTestId(redesignedShellTestIds.timeOffsetPopover)).getByText(label)).toBeTruthy();
    }

    fireEvent.change(getByTestId(redesignedShellTestIds.timeOffsetMinutes), {
      target: { value: "61" },
    });
    fireEvent.change(getByTestId(redesignedShellTestIds.timeOffsetMilliseconds), {
      target: { value: "250" },
    });

    expect(onApply).not.toHaveBeenCalled();

    fireEvent.click(getByTestId(redesignedShellTestIds.timeOffsetApply));

    expect(onApply).toHaveBeenCalledWith({
      days: 0,
      hours: 1,
      minutes: 1,
      seconds: 0,
      milliseconds: 250,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape and returns focus to the invoking offset tag", () => {
    const onClose = vi.fn();
    const { getByRole, getByTestId } = render(<TimeOffsetFocusHarness onClose={onClose} />);
    const trigger = getByRole("button", { name: "Offset trigger" });
    const days = getByTestId(redesignedShellTestIds.timeOffsetDays);

    expect(document.activeElement).toBe(days);

    fireEvent.keyDown(days, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(trigger);
  });

  it("rejects invalid draft values without replacing the previous valid offset", () => {
    const onApply = vi.fn();
    const { getByRole, getByTestId } = render(
      <TimeOffsetPopover
        title="service.log"
        value={{ days: 0, hours: 0, minutes: 5, seconds: 0, milliseconds: 0 }}
        onApply={onApply}
        onClose={vi.fn()}
      />,
    );
    const popover = getByTestId(redesignedShellTestIds.timeOffsetPopover);

    fireEvent.change(getByTestId(redesignedShellTestIds.timeOffsetMinutes), {
      target: { value: "invalid" },
    });

    expect(within(popover).getByRole("alert").textContent).toContain("whole-number");
    expect(getByRole("button", { name: "Apply time offset for service.log" }).hasAttribute("disabled")).toBe(
      true,
    );

    fireEvent.click(getByTestId(redesignedShellTestIds.timeOffsetApply));

    expect(onApply).not.toHaveBeenCalled();
  });
});

function TimeOffsetFocusHarness({ onClose }: { readonly onClose: () => void }) {
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <button ref={triggerRef} type="button">
        Offset trigger
      </button>
      <TimeOffsetPopover
        title="app.log"
        value={{ days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }}
        returnFocusRef={triggerRef}
        onApply={vi.fn()}
        onClose={onClose}
      />
    </>
  );
}
