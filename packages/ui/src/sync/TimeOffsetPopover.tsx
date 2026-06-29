import React from "react";
import type { TimeOffset } from "@crosslog/core";
import { normalizeTimeOffset } from "@crosslog/core";
import { CrosslogIcon } from "../app-shell/icons";
import { Popover, type PopoverFocusReturnRef } from "../app-shell/Popover";
import { redesignedShellTestIds } from "../app-shell/testIds";

export interface TimeOffsetPopoverProps {
  readonly title: string;
  readonly value: TimeOffset;
  readonly returnFocusRef?: PopoverFocusReturnRef;
  readonly onApply: (offset: TimeOffset) => void;
  readonly onClose: () => void;
}

type TimeOffsetField = keyof TimeOffset;
type TimeOffsetDraft = Record<TimeOffsetField, string>;

const offsetFields = [
  { field: "days", label: "Days", visualLabel: "Days", testId: redesignedShellTestIds.timeOffsetDays },
  { field: "hours", label: "Hours", visualLabel: "Hours", testId: redesignedShellTestIds.timeOffsetHours },
  { field: "minutes", label: "Minutes", visualLabel: "Min", testId: redesignedShellTestIds.timeOffsetMinutes },
  { field: "seconds", label: "Seconds", visualLabel: "Sec", testId: redesignedShellTestIds.timeOffsetSeconds },
  {
    field: "milliseconds",
    label: "Milliseconds",
    visualLabel: "Ms",
    testId: redesignedShellTestIds.timeOffsetMilliseconds,
  },
] as const satisfies readonly {
  readonly field: TimeOffsetField;
  readonly label: string;
  readonly visualLabel: string;
  readonly testId: string;
}[];

export function TimeOffsetPopover({ title, value, returnFocusRef, onApply, onClose }: TimeOffsetPopoverProps) {
  const [draft, setDraft] = React.useState<TimeOffsetDraft>(() => createDraft(value));
  const parsedDraft = parseDraft(draft);
  const firstInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setDraft(createDraft(value));
  }, [value]);

  React.useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const updateDraft = (field: TimeOffsetField, nextValue: string) => {
    setDraft((current) => ({
      ...current,
      [field]: nextValue,
    }));
  };

  const applyDraft = () => {
    if (!parsedDraft.valid) {
      return;
    }

    onApply(normalizeTimeOffset(parsedDraft.offset));
    onClose();
  };

  return (
    <Popover
      className="crosslog-time-offset-popover"
      label="Time offset"
      ownerLabel={title}
      onEscapeKeyDown={onClose}
      returnFocusRef={returnFocusRef}
      testId={redesignedShellTestIds.timeOffsetPopover}
    >
      <div className="crosslog-time-offset-popover__content">
        <CrosslogIcon className="crosslog-time-offset-popover__title-icon" name="time-offset" />
        <h3 className="crosslog-time-offset-popover__title">Time Offset</h3>
        <span className="crosslog-time-offset-popover__source" title={title}>
          {title}
        </span>
        <div className="crosslog-time-offset-popover__grid">
          {offsetFields.map(({ field, label, visualLabel, testId }, index) => (
            <label className="crosslog-time-offset-popover__field" key={field}>
              <span className="crosslog-time-offset-popover__field-label" aria-hidden="true">
                {visualLabel}
              </span>
              <input
                aria-invalid={!isValidIntegerDraft(draft[field])}
                aria-label={`${label} offset for ${title}`}
                data-testid={testId}
                inputMode="numeric"
                onChange={(event) => updateDraft(field, event.currentTarget.value)}
                ref={index === 0 ? firstInputRef : undefined}
                type="text"
                value={draft[field]}
              />
            </label>
          ))}
        </div>
        {!parsedDraft.valid ? (
          <span className="crosslog-time-offset-popover__error" role="alert">
            Use whole-number values.
          </span>
        ) : null}
        <button
          className="crosslog-time-offset-popover__apply"
          data-testid={redesignedShellTestIds.timeOffsetApply}
          disabled={!parsedDraft.valid}
          onClick={applyDraft}
          type="button"
          aria-label={`Apply time offset for ${title}`}
        >
          Apply
        </button>
      </div>
    </Popover>
  );
}

function createDraft(offset: TimeOffset): TimeOffsetDraft {
  const normalized = normalizeTimeOffset(offset);

  return {
    days: String(normalized.days),
    hours: String(normalized.hours),
    minutes: String(normalized.minutes),
    seconds: String(normalized.seconds),
    milliseconds: String(normalized.milliseconds),
  };
}

function parseDraft(draft: TimeOffsetDraft): { readonly valid: true; readonly offset: TimeOffset } | { readonly valid: false } {
  if (!offsetFields.every(({ field }) => isValidIntegerDraft(draft[field]))) {
    return { valid: false };
  }

  return {
    valid: true,
    offset: {
      days: Number.parseInt(draft.days, 10),
      hours: Number.parseInt(draft.hours, 10),
      minutes: Number.parseInt(draft.minutes, 10),
      seconds: Number.parseInt(draft.seconds, 10),
      milliseconds: Number.parseInt(draft.milliseconds, 10),
    },
  };
}

function isValidIntegerDraft(value: string): boolean {
  if (!/^[+-]?\d+$/.test(value.trim())) {
    return false;
  }

  return Number.isSafeInteger(Number.parseInt(value, 10));
}
