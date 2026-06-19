/**
 * Roulette · §3.2 OUTCOME-LEAK (LAW 4-adjacent · blocking)
 *
 * Invariant: before settle (`bet === null` OR `bet.result.winningNumber` not
 * yet present), the rendered Stage must not surface any per-pocket winner
 * indication — no `data-winning*`, no `aria-current="true"` highlight, and
 * fiber `memoizedProps` chain on the Stage root must not carry a
 * `winningNumber` field.
 *
 * Fiber gate: explicitly FAIL if `__reactFiber$*` is absent on the root —
 * never silent-pass. If React's runtime stops attaching fiber props to this
 * surface, future scans would be blind; we want the gate to scream.
 */
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Stage } from "../Stage";

function baseProps(overrides: Partial<Parameters<typeof Stage>[0]> = {}) {
  return {
    gameCode: "roulette" as const,
    selection: { bets: [] },
    bet: null,
    clientSeed: "deadbeef",
    commitment: null,
    verification: null,
    busy: false,
    onClientSeedChange: vi.fn(),
    ...overrides,
  };
}

function fiberKeysOn(el: Element): string[] {
  return Object.keys(el).filter((k) => k.startsWith("__reactFiber$"));
}

function memoizedPropsChain(el: Element): unknown[] {
  const out: unknown[] = [];
  const keys = fiberKeysOn(el);
  for (const k of keys) {
    let node = (el as unknown as Record<string, { return?: unknown; memoizedProps?: unknown } | null>)[k];
    let hop = 0;
    while (node && hop < 96) {
      if (node.memoizedProps !== undefined) out.push(node.memoizedProps);
      node = (node.return ?? null) as typeof node;
      hop += 1;
    }
  }
  return out;
}

describe("Roulette · §3.2 OUTCOME-LEAK", () => {
  it("fiber gate is attached on the Stage root (no silent pass)", () => {
    const { container } = render(<Stage {...baseProps()} />);
    const root = container.firstElementChild as Element;
    expect(root).toBeTruthy();
    expect(fiberKeysOn(root).length).toBeGreaterThan(0);
  });

  it("pre-settle: bet === null exposes no winningNumber in DOM attrs or fiber props", () => {
    const { container } = render(<Stage {...baseProps()} />);
    const root = container.firstElementChild as Element;
    const html = root.outerHTML;

    // No "data-winning*" attribute anywhere.
    expect(html).not.toMatch(/data-winning/i);
    // No per-pocket aria-current="true".
    expect(html).not.toMatch(/aria-current="true"/i);
    // No literal "winningNumber" surfaced as text/attr.
    expect(html).not.toMatch(/winningNumber/i);

    // Fiber memoizedProps chain must not carry `winningNumber`.
    const props = memoizedPropsChain(root);
    for (const p of props) {
      if (p && typeof p === "object" && "winningNumber" in (p as Record<string, unknown>)) {
        const wn = (p as { winningNumber: unknown }).winningNumber;
        if (wn !== undefined && wn !== null) {
          throw new Error("LEAK: fiber memoizedProps carries `winningNumber` pre-settle");
        }
      }
    }
  });

  it("post-settle: winning banner appears only when bet.result.winningNumber is defined", () => {
    const { container, rerender } = render(<Stage {...baseProps()} />);
    // Pre-settle: no banner with "·" + multiplier grammar.
    expect(container.outerHTML).not.toMatch(/\d+\s+·\s+\d+\.\d+×/);

    rerender(
      <Stage
        {...baseProps({
          bet: {
            id: "x",
            status: "won",
            result: { winningNumber: 17, totalMultiplier: 36 },
          } as unknown as Parameters<typeof Stage>[0]["bet"],
        })}
      />,
    );
    // Post-settle: banner present with winning number and multiplier.
    expect(container.outerHTML).toMatch(/17/);
    expect(container.outerHTML).toMatch(/36\.00×/);
  });

  it("W9: pocket drop-shadow highlight is gated post-settle WIN only (no pre-settle leak)", () => {
    // Pre-settle: no drop-shadow filter on any pocket path.
    const { container, rerender } = render(<Stage {...baseProps()} />);
    expect(container.outerHTML).not.toMatch(/drop-shadow\(0 0 6px/);

    // Post-settle WIN: at least one pocket carries the amber drop-shadow.
    rerender(
      <Stage
        {...baseProps({
          bet: {
            id: "w",
            status: "won",
            result: { winningNumber: 17, totalMultiplier: 36 },
          } as unknown as Parameters<typeof Stage>[0]["bet"],
        })}
      />,
    );
    expect(container.outerHTML).toMatch(/drop-shadow\(0 0 6px/);

    // Post-settle LOSE: no drop-shadow (highlight gated by `won === true`).
    rerender(
      <Stage
        {...baseProps({
          bet: {
            id: "l",
            status: "lost",
            result: { winningNumber: 17, totalMultiplier: 0 },
          } as unknown as Parameters<typeof Stage>[0]["bet"],
        })}
      />,
    );
    expect(container.outerHTML).not.toMatch(/drop-shadow\(0 0 6px/);
  });
});
