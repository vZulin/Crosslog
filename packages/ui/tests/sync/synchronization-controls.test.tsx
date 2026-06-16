import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SynchronizationToggle } from "../../src/sync/SynchronizationToggle";
import { TimeOffsetEditor } from "../../src/sync/TimeOffsetEditor";
import { VirtualLogViewport } from "../../src/log-pane/VirtualLogViewport";

describe("synchronization controls", () => {
  it("toggles global time synchronization", () => {
    const onEnabledChange = vi.fn();
    const { getByLabelText } = render(
      <SynchronizationToggle enabled={true} onEnabledChange={onEnabledChange} />,
    );

    fireEvent.click(getByLabelText("Synchronize by time"));

    expect(onEnabledChange).toHaveBeenCalledWith(false);
  });

  it("normalizes edited per-pane offsets", () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <TimeOffsetEditor
        title="app.log"
        value={{ days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }}
        onChange={onChange}
      />,
    );

    fireEvent.change(getByLabelText("minutes offset for app.log"), { target: { value: "61" } });

    expect(onChange).toHaveBeenCalledWith({
      days: 0,
      hours: 1,
      minutes: 1,
      seconds: 0,
      milliseconds: 0,
    });
  });

  it("reports time anchors and marks synchronized target lines", () => {
    const onTimeAnchorChange = vi.fn();
    const { getByText } = render(
      <VirtualLogViewport
        title="app.log"
        lines={["2026-06-16T09:00:00.000Z first", "2026-06-16T09:00:01.000Z second"]}
        timestamps={[new Date("2026-06-16T09:00:00.000Z"), new Date("2026-06-16T09:00:01.000Z")]}
        synchronizationTargetLineNumber={2}
        onTimeAnchorChange={onTimeAnchorChange}
      />,
    );

    fireEvent.click(getByText("2026-06-16T09:00:01.000Z second").closest("li")!);

    expect(onTimeAnchorChange).toHaveBeenCalledWith(2, new Date("2026-06-16T09:00:01.000Z"));
    expect(getByText("2026-06-16T09:00:01.000Z second").closest("li")?.getAttribute("data-sync-target")).toBe(
      "true",
    );
  });
});
