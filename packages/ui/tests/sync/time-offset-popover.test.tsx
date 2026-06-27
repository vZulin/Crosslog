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
