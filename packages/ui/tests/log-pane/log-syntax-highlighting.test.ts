import { describe, expect, it } from "vitest";
import { segmentLogLineText, tokenizeLogLineSyntax } from "../../src/log-pane/logSyntaxHighlighting";

describe("log syntax highlighting", () => {
  it.each([
    ["timestamp", "2026-06-16T09:00:00.000Z INFO started", "2026-06-16T09:00:00.000Z"],
    ["severity", "2026-06-16 WARN slow response", "WARN"],
    ["property", "worker=release-fixture message=stable-open-benchmark", "worker"],
    ["string", 'message="stable open benchmark"', '"stable open benchmark"'],
    ["number", "retryCount=42 latencyMs=3.14 budget=1e6", "42"],
    ["constant", "enabled=true fallback=null unresolved=undefined", "true"],
    ["uuid", "requestId=550e8400-e29b-41d4-a716-446655440000 accepted", "550e8400-e29b-41d4-a716-446655440000"],
    ["ip", "sourceIp=192.168.10.24 connected", "192.168.10.24"],
    ["url", "endpoint=https://example.test/api/v1/jobs/42", "https://example.test/api/v1/jobs/42"],
    ["path", "path=/var/log/crosslog/app.log", "/var/log/crosslog/app.log"],
    ["email", "owner=ops@example.test", "ops@example.test"],
  ] as const)("tokenizes %s patterns", (kind, line, expectedText) => {
    const token = tokenizeLogLineSyntax(line).find((candidate) => candidate.kind === kind);

    expect(token).toMatchObject({ kind, text: expectedText });
  });

  it("prefers quoted strings over nested path and url patterns", () => {
    const line = 'message="Open https://example.test from /var/log/crosslog/app.log"';
    const tokens = tokenizeLogLineSyntax(line);

    expect(tokens).toContainEqual({
      kind: "property",
      start: 0,
      end: 7,
      text: "message",
    });
    expect(tokens).toContainEqual({
      kind: "string",
      start: 8,
      end: line.length,
      text: '"Open https://example.test from /var/log/crosslog/app.log"',
    });
    expect(tokens.some((token) => token.kind === "url")).toBe(false);
    expect(tokens.some((token) => token.kind === "path")).toBe(false);
  });

  it("splits syntax and search ranges without losing token metadata", () => {
    const line = "2026-06-16T09:00:00.000Z WARN worker=release";
    const segments = segmentLogLineText(
      line,
      tokenizeLogLineSyntax(line),
      [{ lineNumber: 1, range: { start: 25, end: 29 } }],
      1,
      { lineNumber: 1, range: { start: 25, end: 29 } },
    );

    expect(
      segments.find(
        (segment) => segment.text === "WARN" && segment.tokenKind === "severity" && segment.activeSearchMatch,
      ),
    ).toBeDefined();
    expect(
      segments.find((segment) => segment.text === "worker" && segment.tokenKind === "property"),
    ).toBeDefined();
  });
});
