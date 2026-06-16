import { describe, expect, it } from 'vitest';
import { WsStallDetector } from './ws-stall-detector';

describe('WsStallDetector', () => {
  it('detects stall after stallMs without touch', () => {
    let now = 0;
    const detector = new WsStallDetector({ stallMs: 1000, now: () => now });

    expect(detector.isStalled()).toBe(false);
    now += 1001;
    expect(detector.isStalled()).toBe(true);
  });

  it('resets stall clock on touch', () => {
    let now = 0;
    const detector = new WsStallDetector({ stallMs: 1000, now: () => now });

    now += 500;
    detector.touch();
    now += 800;
    expect(detector.isStalled()).toBe(false);
  });
});
