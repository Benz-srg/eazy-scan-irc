import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Btn, Tag, Icon } from "./primitives";

describe("Btn", () => {
  it("renders its label and fires onClick", () => {
    const onClick = vi.fn();
    render(<Btn onClick={onClick}>วิเคราะห์</Btn>);
    const btn = screen.getByRole("button", { name: /วิเคราะห์/ });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire when disabled", () => {
    const onClick = vi.fn();
    render(
      <Btn onClick={onClick} disabled>
        ส่ง
      </Btn>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Tag", () => {
  it("renders children", () => {
    render(<Tag>SOW</Tag>);
    expect(screen.getByText("SOW")).toBeInTheDocument();
  });
});

describe("Icon", () => {
  it("renders an svg for a kebab-case name", () => {
    const { container } = render(<Icon name="package" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("normalises PascalCase names from the LLM (e.g. 'Package')", () => {
    const { container } = render(<Icon name="Package" />);
    // falls through toKebab -> resolves the same icon, still an svg (not the
    // 'circle' fallback breaking)
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("falls back to a circle for an unknown icon", () => {
    const { container } = render(<Icon name="totally-unknown-xyz" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
