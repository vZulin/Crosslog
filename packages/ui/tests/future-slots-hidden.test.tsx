import React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { FuturePaneToolbarSlot } from "../src/log-pane/FuturePaneToolbarSlot";

describe("future UI slots", () => {
  it("keeps future controls hidden in the MVP", () => {
    const { getByTestId } = render(<FuturePaneToolbarSlot />);

    expect(getByTestId("future-pane-toolbar-slot").hasAttribute("hidden")).toBe(true);
  });
});
