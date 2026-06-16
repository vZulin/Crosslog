import type { SearchMatch, SearchState } from "./search-state";
import { createSearchQuery, type SearchQuery } from "./search-query";

export function searchLogLines(lines: readonly string[], query: SearchQuery): SearchState {
  if (query.text.length === 0) {
    return createSearchState(query, [], null);
  }

  if (query.mode === "regex") {
    return searchRegex(lines, query);
  }

  return createSearchState(query, searchText(lines, query), null);
}

function searchText(lines: readonly string[], query: SearchQuery): readonly SearchMatch[] {
  const needle = query.caseSensitive ? query.text : query.text.toLocaleLowerCase();
  const matches: SearchMatch[] = [];

  lines.forEach((line, lineIndex) => {
    const haystack = query.caseSensitive ? line : line.toLocaleLowerCase();
    let start = haystack.indexOf(needle);

    while (start >= 0) {
      matches.push({
        lineNumber: lineIndex + 1,
        range: {
          start,
          end: start + query.text.length,
        },
      });
      start = haystack.indexOf(needle, start + query.text.length);
    }
  });

  return matches;
}

function searchRegex(lines: readonly string[], query: SearchQuery): SearchState {
  let expression: RegExp;

  try {
    expression = new RegExp(query.text, query.caseSensitive ? "g" : "gi");
  } catch (error) {
    return createSearchState(query, [], error instanceof Error ? error.message : "Invalid regular expression");
  }

  const matches: SearchMatch[] = [];

  lines.forEach((line, lineIndex) => {
    expression.lastIndex = 0;
    let match = expression.exec(line);

    while (match) {
      matches.push({
        lineNumber: lineIndex + 1,
        range: {
          start: match.index,
          end: match.index + match[0].length,
        },
      });

      if (match[0].length === 0) {
        expression.lastIndex += 1;
      }

      match = expression.exec(line);
    }
  });

  return createSearchState(query, matches, null);
}

function createSearchState(
  query: SearchQuery = createSearchQuery(""),
  matches: readonly SearchMatch[],
  error: string | null,
): SearchState {
  return {
    query: query.text,
    mode: query.mode,
    caseSensitive: query.caseSensitive,
    matches,
    currentMatchIndex: matches.length > 0 ? 0 : null,
    error,
  };
}
