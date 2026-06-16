import React from "react";
import type { TimeOffset } from "@crosslog/core";
import { normalizeTimeOffset, zeroTimeOffset } from "@crosslog/core";

export interface TimeOffsetEditorProps {
  readonly title: string;
  readonly value: TimeOffset;
  readonly onChange: (offset: TimeOffset) => void;
}

export function TimeOffsetEditor({ title, value, onChange }: TimeOffsetEditorProps) {
  const update = (field: keyof TimeOffset, nextValue: number) => {
    onChange(normalizeTimeOffset({ ...value, [field]: nextValue }));
  };

  return (
    <fieldset aria-label={`Time offset for ${title}`}>
      <legend>Offset</legend>
      {offsetFields.map((field) => (
        <label key={field}>
          {field}
          <input
            type="number"
            aria-label={`${field} offset for ${title}`}
            value={value[field]}
            onChange={(event) => update(field, Number.parseInt(event.currentTarget.value || "0", 10))}
          />
        </label>
      ))}
      <button type="button" aria-label={`Reset time offset for ${title}`} onClick={() => onChange(zeroTimeOffset)}>
        Reset
      </button>
    </fieldset>
  );
}

const offsetFields: readonly (keyof TimeOffset)[] = ["days", "hours", "minutes", "seconds", "milliseconds"];
