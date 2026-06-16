export interface StallDetectorOptions {
  readonly stallMs?: number;
  readonly now?: () => number;
}

/** Detects ingest silence — triggers reconnect when no WS traffic within stallMs. */
export class WsStallDetector {
  private lastActivityAt: number;
  private readonly stallMs: number;
  private readonly now: () => number;

  constructor(options: StallDetectorOptions = {}) {
    this.stallMs = options.stallMs ?? 120_000;
    this.now = options.now ?? (() => Date.now());
    this.lastActivityAt = this.now();
  }

  touch(): void {
    this.lastActivityAt = this.now();
  }

  isStalled(): boolean {
    return this.now() - this.lastActivityAt >= this.stallMs;
  }

  elapsedMs(): number {
    return this.now() - this.lastActivityAt;
  }
}
