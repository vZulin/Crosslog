import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SynchronizationToggle } from "../../src/sync/SynchronizationToggle";
import { TimeOffsetEditor } from "../../src/sync/TimeOffsetEditor";
import { VirtualLogViewport } from "../../src/log-pane/VirtualLogViewport";

describe("synchronization controls", () => {
  it("toggles global time synchronization", () => {
    const onEnabledChange = vi.fn();
    const { getByRole } = render(
      <SynchronizationToggle enabled={true} onEnabledChange={onEnabledChange} />,
    );

    fireEvent.click(getByRole("button", { name: "Toggle time synchronization" }));

    expect(onEnabledChange).toHaveBeenCalledWith(false);
  });

  it("applies only valid per-pane offset edits", () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <TimeOffsetEditor
        title="app.log"
        value={{ days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }}
        onChange={onChange}
      />,
    );

    fireEvent.change(getByLabelText("minutes offset for app.log"), { target: { value: "61" } });

    expect(getByLabelText("minutes offset for app.log").getAttribute("aria-invalid")).toBe("true");
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(getByLabelText("minutes offset for app.log"), { target: { value: "59" } });

    expect(onChange).toHaveBeenCalledWith({
      days: 0,
      hours: 0,
      minutes: 59,
      seconds: 0,
      milliseconds: 0,
    });
  });

  it("reports time anchors and marks synchronized target lines", () => {
    const onTimeAnchorChange = vi.fn();
    const { container } = render(
      <VirtualLogViewport
        title="app.log"
        lines={["2026-06-16T09:00:00.000Z first", "2026-06-16T09:00:01.000Z second"]}
        timestamps={[new Date("2026-06-16T09:00:00.000Z"), new Date("2026-06-16T09:00:01.000Z")]}
        synchronizationTargetLineNumber={2}
        onTimeAnchorChange={onTimeAnchorChange}
      />,
    );
    const targetRow = container.querySelector('[data-line-number="2"]');

    fireEvent.click(targetRow!);

    expect(onTimeAnchorChange).toHaveBeenCalledWith(2, new Date("2026-06-16T09:00:01.000Z"), 0, "click");
    expect(targetRow?.getAttribute("data-sync-target")).toBe("true");
  });
});
