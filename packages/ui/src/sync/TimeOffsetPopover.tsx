import React from "react";
import type { TimeOffset, TimeOffsetDraft, TimeOffsetDraftFieldError, TimeOffsetField } from "@crosslog/core";
import { createTimeOffsetDraft, validateTimeOffsetDraft } from "@crosslog/core";
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
  const validation = validateTimeOffsetDraft(draft);
  const errorsByField = createErrorMap(validation.errors);
  const firstError = validation.errors[0] ?? null;
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
    if (!validation.valid) {
      return;
    }

    onApply(validation.offset);
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
              {errorsByField[field] ? (
                <span className="crosslog-time-offset-popover__field-error" id={fieldErrorId(title, field)}>
                  {errorsByField[field]?.message}
                </span>
              ) : null}
              <input
                aria-describedby={errorsByField[field] ? fieldErrorId(title, field) : undefined}
                aria-errormessage={errorsByField[field] ? fieldErrorId(title, field) : undefined}
                aria-invalid={errorsByField[field] ? true : undefined}
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
        {firstError ? (
          <span className="crosslog-time-offset-popover__error" role="alert">
            {firstError.message}
          </span>
        ) : null}
        <button
          className="crosslog-time-offset-popover__apply"
          data-testid={redesignedShellTestIds.timeOffsetApply}
          disabled={!validation.valid}
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
  return createTimeOffsetDraft(offset);
}

function createErrorMap(
  errors: readonly TimeOffsetDraftFieldError[],
): Partial<Record<TimeOffsetField, TimeOffsetDraftFieldError>> {
  const errorMap: Partial<Record<TimeOffsetField, TimeOffsetDraftFieldError>> = {};

  for (const error of errors) {
    errorMap[error.field] = error;
  }

  return errorMap;
}

function fieldErrorId(title: string, field: TimeOffsetField): string {
  return `time-offset-${field}-error-${title.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
