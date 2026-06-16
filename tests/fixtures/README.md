# Release Fixtures

Crosslog release validation uses deterministic fixtures so benchmarks and UI
checks measure product behavior instead of sample-data variance.

## Fixture Groups

- `large-20mb-log.fixture.ts`: describes the canonical 20 MB log size used by
  open, virtualization, and search benchmarks.
- `timestamped-logs.fixture.ts`: provides overlapping timestamped lines,
  untimed lines, and invalid timestamp candidates for synchronization checks.
- `encoded-logs.fixture.ts`: lists required encodings for manual and automatic
  decode validation.
- `generate-log-fixtures.ts`: writes repeatable timestamped log files for
  integration or local release runs.

## Release Coverage

The release fixture set must cover:

- 20 MB open and search paths.
- Directory ordering, switching, deletion, addition, and same-name recreation.
- Logs with overlapping timestamps, no timestamps, and invalid timestamp
  candidates.
- UTF-8, UTF-8 BOM, UTF-16 LE, UTF-16 BE, Windows-1251, and Windows-1252.
- Command-like text, HTML-like text, links, and terminal escape sequences.
- Corrupt, unreadable, oversized, and memory-limited files.

## Maintenance Rules

- Keep fixtures deterministic and small unless a benchmark explicitly requires
  the 20 MB size class.
- Do not update expected data to match broken behavior.
- Treat every fixture as read-only input during tests.
- Add new fixture metadata beside the fixture producer or constant it supports.
