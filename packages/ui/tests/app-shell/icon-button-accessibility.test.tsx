import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IconButton } from "../../src/app-shell/IconButton";

describe("IconButton", () => {
  it("exposes an accessible name while keeping the visual control icon-only", () => {
    const { getByRole } = render(<IconButton icon="search" label="Search logs" />);

    const button = getByRole("button", { name: "Search logs" });

    expect(button.getAttribute("title")).toBe("Search logs");
    expect(button.textContent).toBe("");
  });

  it("reports pressed and active state independently", () => {
    const { getByRole } = render(
      <IconButton active={true} icon="sync" label="Toggle time synchronization" pressed={true} />,
    );

    const button = getByRole("button", { name: "Toggle time synchronization" });

    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.getAttribute("data-active")).toBe("true");
  });

  it("prevents unavailable future controls from dispatching actions", () => {
    const onClick = vi.fn();
    const { getByRole } = render(
      <IconButton
        icon="filter"
        label="Filters unavailable"
        unavailable={true}
        onClick={onClick}
      />,
    );

    const button = getByRole("button", { name: "Filters unavailable" });

    fireEvent.click(button);

    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(onClick).not.toHaveBeenCalled();
  });
});
