import type { SearchMatch, SearchState } from "./search-state";
import { createSearchQuery } from "./search-query";
import { searchLogLines } from "./search-engine";

export function updateSearchIndex(
  previousState: SearchState,
  lines: readonly string[],
  nextState: SearchState = previousState,
): SearchState {
  const result = searchLogLines(
    lines,
    createSearchQuery(nextState.query, nextState.mode, nextState.caseSensitive),
  );

  if (result.matches.length === 0 || result.error) {
    return result;
  }

  const previousMatch = getCurrentMatch(previousState);
  const retainedMatchIndex = previousMatch ? findMatchIndex(result.matches, previousMatch) : -1;
  const currentMatchIndex =
    retainedMatchIndex >= 0
      ? retainedMatchIndex
      : Math.min(previousState.currentMatchIndex ?? 0, result.matches.length - 1);

  return {
    ...result,
    currentMatchIndex,
  };
}

function getCurrentMatch(state: SearchState): SearchMatch | null {
  return state.currentMatchIndex === null ? null : state.matches[state.currentMatchIndex] ?? null;
}

function findMatchIndex(matches: readonly SearchMatch[], target: SearchMatch): number {
  return matches.findIndex(
    (match) =>
      match.lineNumber === target.lineNumber &&
      match.range.start === target.range.start &&
      match.range.end === target.range.end,
  );
}
