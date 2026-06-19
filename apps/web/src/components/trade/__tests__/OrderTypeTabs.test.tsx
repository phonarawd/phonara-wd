/**
 * Wave 6R — OrderTypeTabs smoke.
 * 3 tabs render, aria-selected reflects value, onChange fires with correct id.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { OrderTypeTabs } from "../OrderTypeTabs";

describe("Wave 6R OrderTypeTabs", () => {
  it("renders 3 tab buttons", () => {
    cleanup();
    render(<OrderTypeTabs value="limit" onChange={() => {}} />);
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("aria-selected reflects value prop", () => {
    cleanup();
    render(<OrderTypeTabs value="market" onChange={() => {}} />);
    const tabs = screen.getAllByRole("tab");
    const selected = tabs.filter((t) => t.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(1);
  });

  it("clicking a tab fires onChange with the order-type id", () => {
    cleanup();
    const onChange = vi.fn();
    render(<OrderTypeTabs value="limit" onChange={onChange} />);
    const tabs = screen.getAllByRole("tab");
    // items order: limit, market, stop
    fireEvent.click(tabs[1]);
    expect(onChange).toHaveBeenCalledWith("market");
    fireEvent.click(tabs[2]);
    expect(onChange).toHaveBeenCalledWith("stop");
  });
});
