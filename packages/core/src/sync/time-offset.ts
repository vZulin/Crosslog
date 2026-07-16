export interface TimeOffset {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly milliseconds: number;
}

export type TimeOffsetField = keyof TimeOffset;
export type TimeOffsetDraft = Record<TimeOffsetField, string>;
export type TimeOffsetDraftErrorCode = "notWholeNumber" | "outOfRange";

export interface TimeOffsetDraftFieldError {
  readonly field: TimeOffsetField;
  readonly code: TimeOffsetDraftErrorCode;
  readonly message: string;
}

export type TimeOffsetDraftValidationResult =
  | {
      readonly valid: true;
      readonly offset: TimeOffset;
      readonly errors: readonly [];
    }
  | {
      readonly valid: false;
      readonly errors: readonly TimeOffsetDraftFieldError[];
    };

export const zeroTimeOffset: TimeOffset = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  milliseconds: 0,
};

export const timeOffsetFields = ["days", "hours", "minutes", "seconds", "milliseconds"] as const satisfies readonly TimeOffsetField[];

const MILLISECONDS_PER_SECOND = 1_000;
const MILLISECONDS_PER_MINUTE = 60 * MILLISECONDS_PER_SECOND;
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;

const fieldLabels = {
  days: "Days",
  hours: "Hours",
  minutes: "Minutes",
  seconds: "Seconds",
  milliseconds: "Milliseconds",
} as const satisfies Record<TimeOffsetField, string>;

const boundedFieldRanges = {
  hours: { min: -23, max: 23 },
  minutes: { min: -59, max: 59 },
  seconds: { min: -59, max: 59 },
  milliseconds: { min: -999, max: 999 },
} as const satisfies Partial<Record<TimeOffsetField, { readonly min: number; readonly max: number }>>;

export function timeOffsetToMilliseconds(offset: TimeOffset): number {
  return (
    offset.days * MILLISECONDS_PER_DAY +
    offset.hours * MILLISECONDS_PER_HOUR +
    offset.minutes * MILLISECONDS_PER_MINUTE +
    offset.seconds * MILLISECONDS_PER_SECOND +
    offset.milliseconds
  );
}

export function normalizeTimeOffset(offset: TimeOffset): TimeOffset {
  const sign = timeOffsetToMilliseconds(offset) < 0 ? -1 : 1;
  let remaining = Math.abs(timeOffsetToMilliseconds(offset));

  const days = Math.trunc(remaining / MILLISECONDS_PER_DAY);
  remaining %= MILLISECONDS_PER_DAY;
  const hours = Math.trunc(remaining / MILLISECONDS_PER_HOUR);
  remaining %= MILLISECONDS_PER_HOUR;
  const minutes = Math.trunc(remaining / MILLISECONDS_PER_MINUTE);
  remaining %= MILLISECONDS_PER_MINUTE;
  const seconds = Math.trunc(remaining / MILLISECONDS_PER_SECOND);
  const milliseconds = remaining % MILLISECONDS_PER_SECOND;

  return {
    days: days * sign,
    hours: hours * sign,
    minutes: minutes * sign,
    seconds: seconds * sign,
    milliseconds: milliseconds * sign,
  };
}

export function createTimeOffsetDraft(offset: TimeOffset): TimeOffsetDraft {
  const normalized = normalizeTimeOffset(offset);

  return {
    days: String(normalized.days),
    hours: String(normalized.hours),
    minutes: String(normalized.minutes),
    seconds: String(normalized.seconds),
    milliseconds: String(normalized.milliseconds),
  };
}

export function validateTimeOffsetDraft(draft: TimeOffsetDraft): TimeOffsetDraftValidationResult {
  const parsedFields: Partial<Record<TimeOffsetField, number>> = {};
  const errors: TimeOffsetDraftFieldError[] = [];

  for (const field of timeOffsetFields) {
    const fieldResult = parseTimeOffsetDraftField(field, draft[field]);

    if (fieldResult.valid) {
      parsedFields[field] = fieldResult.value;
      continue;
    }

    errors.push(fieldResult.error);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    offset: {
      days: parsedFields.days ?? 0,
      hours: parsedFields.hours ?? 0,
      minutes: parsedFields.minutes ?? 0,
      seconds: parsedFields.seconds ?? 0,
      milliseconds: parsedFields.milliseconds ?? 0,
    },
    errors: [],
  };
}

export function applyTimeOffset(timestamp: Date, offset: TimeOffset): Date {
  return new Date(timestamp.getTime() + timeOffsetToMilliseconds(offset));
}

export function formatTimeOffset(offset: TimeOffset): string {
  const normalized = normalizeTimeOffset(offset);
  const totalMilliseconds = timeOffsetToMilliseconds(normalized);

  if (totalMilliseconds === 0) {
    return "0 ms";
  }

  const parts = ([
    ["d", normalized.days],
    ["h", normalized.hours],
    ["m", normalized.minutes],
    ["s", normalized.seconds],
    ["ms", normalized.milliseconds],
  ] as const)
    .filter(([, value]) => value !== 0)
    .map(([unit, value]) => `${Math.abs(value)}${unit}`);

  return `${totalMilliseconds < 0 ? "-" : "+"}${parts.join(" ")}`;
}

function parseTimeOffsetDraftField(
  field: TimeOffsetField,
  rawValue: string,
): { readonly valid: true; readonly value: number } | { readonly valid: false; readonly error: TimeOffsetDraftFieldError } {
  const value = rawValue.trim();

  if (value === "") {
    return { valid: true, value: 0 };
  }

  if (!/^[+-]?\d+$/.test(value)) {
    return {
      valid: false,
      error: {
        field,
        code: "notWholeNumber",
        message: `${fieldLabels[field]} must be a whole number.`,
      },
    };
  }

  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isSafeInteger(parsedValue)) {
    return {
      valid: false,
      error: {
        field,
        code: "notWholeNumber",
        message: `${fieldLabels[field]} must be a safe whole number.`,
      },
    };
  }

  const range = boundedFieldRanges[field];

  if (range && (parsedValue < range.min || parsedValue > range.max)) {
    return {
      valid: false,
      error: {
        field,
        code: "outOfRange",
        message: `${fieldLabels[field]} must be between ${range.min} and ${range.max}.`,
      },
    };
  }

  return { valid: true, value: parsedValue };
}
