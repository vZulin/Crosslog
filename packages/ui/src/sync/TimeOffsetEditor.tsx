import React from "react";
import type { TimeOffset, TimeOffsetDraft, TimeOffsetDraftFieldError, TimeOffsetField } from "@crosslog/core";
import { createTimeOffsetDraft, timeOffsetFields, validateTimeOffsetDraft, zeroTimeOffset } from "@crosslog/core";

export interface TimeOffsetEditorProps {
  readonly title: string;
  readonly value: TimeOffset;
  readonly onChange: (offset: TimeOffset) => void;
}

export function TimeOffsetEditor({ title, value, onChange }: TimeOffsetEditorProps) {
  const [draft, setDraft] = React.useState<TimeOffsetDraft>(() => createTimeOffsetDraft(value));
  const validation = validateTimeOffsetDraft(draft);
  const errorsByField = createErrorMap(validation.errors);

  React.useEffect(() => {
    setDraft(createTimeOffsetDraft(value));
  }, [value]);

  const update = (field: TimeOffsetField, nextValue: string) => {
    const nextDraft = {
      ...draft,
      [field]: nextValue,
    };
    const nextValidation = validateTimeOffsetDraft(nextDraft);

    setDraft(nextDraft);

    if (nextValidation.valid) {
      onChange(nextValidation.offset);
    }
  };

  const reset = () => {
    setDraft(createTimeOffsetDraft(zeroTimeOffset));
    onChange(zeroTimeOffset);
  };

  return (
    <fieldset aria-label={`Time offset for ${title}`}>
      <legend>Offset</legend>
      {timeOffsetFields.map((field) => (
        <label key={field}>
          {field}
          {errorsByField[field] ? (
            <span className="crosslog-time-offset-editor__field-error" id={fieldErrorId(title, field)}>
              {errorsByField[field]?.message}
            </span>
          ) : null}
          <input
            type="text"
            inputMode="text"
            aria-describedby={errorsByField[field] ? fieldErrorId(title, field) : undefined}
            aria-errormessage={errorsByField[field] ? fieldErrorId(title, field) : undefined}
            aria-invalid={errorsByField[field] ? true : undefined}
            aria-label={`${field} offset for ${title}`}
            value={draft[field]}
            onChange={(event) => update(field, event.currentTarget.value)}
          />
        </label>
      ))}
      {!validation.valid ? (
        <span className="crosslog-time-offset-editor__error" role="alert">
          {validation.errors[0]?.message}
        </span>
      ) : null}
      <button type="button" aria-label={`Reset time offset for ${title}`} onClick={reset}>
        Reset
      </button>
    </fieldset>
  );
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
  return `time-offset-editor-${field}-error-${title.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
