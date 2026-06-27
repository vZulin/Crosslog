export interface TimeOffset {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly milliseconds: number;
}

export const zeroTimeOffset: TimeOffset = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  milliseconds: 0,
};

const MILLISECONDS_PER_SECOND = 1_000;
const MILLISECONDS_PER_MINUTE = 60 * MILLISECONDS_PER_SECOND;
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;

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
