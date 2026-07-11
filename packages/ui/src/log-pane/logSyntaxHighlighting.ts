import type { SearchMatch } from "@crosslog/core";

export type LogSyntaxTokenKind =
  | "timestamp"
  | "severity"
  | "property"
  | "string"
  | "number"
  | "constant"
  | "uuid"
  | "ip"
  | "url"
  | "path"
  | "email";

export interface LogSyntaxToken {
  readonly kind: LogSyntaxTokenKind;
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

export interface LogLineTextSegment {
  readonly text: string;
  readonly tokenKind: LogSyntaxTokenKind | null;
  readonly searchMatch: SearchMatch | null;
  readonly activeSearchMatch: boolean;
}

interface TokenPattern {
  readonly kind: LogSyntaxTokenKind;
  readonly regex: RegExp;
}

interface TokenCandidate extends LogSyntaxToken {
  readonly priority: number;
}

const tokenPatterns: readonly TokenPattern[] = [
  {
    kind: "string",
    regex: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g,
  },
  {
    kind: "url",
    regex: /\bhttps?:\/\/[^\s"'`()\[\]{}<>|]+/gi,
  },
  {
    kind: "email",
    regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  },
  {
    kind: "path",
    regex:
      /(?<![\w./<\-])(?:[A-Za-z]:\\|\\\\)[^\s"'`()\[\]{}<>|]+|(?<![\w./<\-])(?:\/[^/\s"'`()\[\]{}<>|]+)+/g,
  },
  {
    kind: "timestamp",
    regex:
      /\b\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d{3,9})?(?:Z|[+-]\d{2}:\d{2})?)?\b|\b\d{2}:\d{2}:\d{2}(?:[.,]\d{3,9})?\b/g,
  },
  {
    kind: "uuid",
    regex: /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
  },
  {
    kind: "ip",
    regex:
      /\b(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}\b/g,
  },
  {
    kind: "severity",
    regex: /\b(?:trace|debug|info|warn(?:ing)?|error|err|fatal)\b/gi,
  },
  {
    kind: "constant",
    regex: /\b(?:true|false|null|undefined|NaN|Infinity)\b/g,
  },
  {
    kind: "property",
    regex: /\b[A-Za-z_][\w.-]*\b(?=\s*[=:])/g,
  },
  {
    kind: "number",
    regex: /(?<![\w./-])-?(?:0x[0-9a-f]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/gi,
  },
] as const;

export function tokenizeLogLineSyntax(text: string): readonly LogSyntaxToken[] {
  if (text.length === 0) {
    return [];
  }

  const candidates = tokenPatterns.flatMap((pattern, priority) =>
    collectCandidates(text, pattern, priority),
  );

  candidates.sort((left, right) => {
    if (left.start !== right.start) {
      return left.start - right.start;
    }

    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }

    return right.end - left.end;
  });

  const accepted: LogSyntaxToken[] = [];
  let occupiedUntil = -1;

  for (const candidate of candidates) {
    if (candidate.start < occupiedUntil) {
      continue;
    }

    accepted.push({
      kind: candidate.kind,
      start: candidate.start,
      end: candidate.end,
      text: candidate.text,
    });
    occupiedUntil = candidate.end;
  }

  return accepted;
}

export function segmentLogLineText(
  text: string,
  syntaxTokens: readonly LogSyntaxToken[],
  matches: readonly SearchMatch[],
  lineNumber: number,
  activeSearchMatch: SearchMatch | null,
): readonly LogLineTextSegment[] {
  if (text.length === 0) {
    return [];
  }

  if (syntaxTokens.length === 0 && matches.length === 0) {
    return [
      {
        text,
        tokenKind: null,
        searchMatch: null,
        activeSearchMatch: false,
      },
    ];
  }

  const boundaries = new Set<number>([0, text.length]);

  syntaxTokens.forEach((token) => {
    boundaries.add(token.start);
    boundaries.add(token.end);
  });
  matches.forEach((match) => {
    const start = clampRangeValue(match.range.start, text.length);
    const end = clampRangeValue(match.range.end, text.length);

    boundaries.add(start);
    boundaries.add(end);
  });

  const orderedBoundaries = [...boundaries].sort((left, right) => left - right);
  const segments: LogLineTextSegment[] = [];
  let tokenIndex = 0;
  let matchIndex = 0;

  for (let index = 0; index < orderedBoundaries.length - 1; index += 1) {
    const start = orderedBoundaries[index]!;
    const end = orderedBoundaries[index + 1]!;

    if (end <= start) {
      continue;
    }

    while (tokenIndex < syntaxTokens.length && syntaxTokens[tokenIndex]!.end <= start) {
      tokenIndex += 1;
    }

    while (matchIndex < matches.length && clampRangeValue(matches[matchIndex]!.range.end, text.length) <= start) {
      matchIndex += 1;
    }

    const token =
      tokenIndex < syntaxTokens.length &&
      syntaxTokens[tokenIndex]!.start <= start &&
      syntaxTokens[tokenIndex]!.end >= end
        ? syntaxTokens[tokenIndex]!
        : null;
    const searchMatch =
      matchIndex < matches.length &&
      clampRangeValue(matches[matchIndex]!.range.start, text.length) <= start &&
      clampRangeValue(matches[matchIndex]!.range.end, text.length) >= end
        ? matches[matchIndex]!
        : null;

    segments.push({
      text: text.slice(start, end),
      tokenKind: token?.kind ?? null,
      searchMatch,
      activeSearchMatch:
        searchMatch !== null &&
        activeSearchMatch !== null &&
        activeSearchMatch.lineNumber === lineNumber &&
        activeSearchMatch.range.start === searchMatch.range.start &&
        activeSearchMatch.range.end === searchMatch.range.end,
    });
  }

  return segments;
}

function collectCandidates(text: string, pattern: TokenPattern, priority: number): readonly TokenCandidate[] {
  pattern.regex.lastIndex = 0;

  const candidates: TokenCandidate[] = [];
  let match = pattern.regex.exec(text);

  while (match) {
    const matchedText = match[0];
    const start = match.index;
    const end = start + matchedText.length;

    if (matchedText.length > 0) {
      candidates.push({
        kind: pattern.kind,
        start,
        end,
        text: matchedText,
        priority,
      });
    }

    match = pattern.regex.exec(text);
  }

  return candidates;
}

function clampRangeValue(value: number, max: number): number {
  return Math.max(0, Math.min(max, value));
}
