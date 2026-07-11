/**
 * Shared Pixi v8 Application lifecycle (§25.5 · §23.4).
 * Lazy `import('pixi.js')` · destroy(true) on unmount · E2E ticker stop · tab visibility pause.
 */

import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Application, Container, Graphics } from 'pixi.js';

import {
  CASINO_PIXI_MAX_FPS,
  isPixiE2eEngineOff,
} from '@/domain/casino-games-batch-c-display-contract';

/** Runtime constructors from lazy `import('pixi.js')` — avoid static side effects in tests. */
export type PixiModule = {
  Application: typeof Application;
  Container: typeof Container;
  Graphics: typeof Graphics;
};

export type PixiStageController = {
  /** Optional — called after canvas resize. */
  onResize?: (width: number, height: number) => void;
  destroy?: () => void;
};

export type UsePixiStageResult = {
  ready: boolean;
  appRef: RefObject<Application | null>;
};

/**
 * Mounts a Pixi Application into `hostRef`. `build` runs once after init.
 * Init failure (jsdom / no WebGL) → ready=false; stages still use React overlays.
 */
export function usePixiStage(
  hostRef: RefObject<HTMLElement | null>,
  build: (app: Application, pixi: PixiModule) => PixiStageController | void,
): UsePixiStageResult {
  const [ready, setReady] = useState(false);
  const appRef = useRef<Application | null>(null);
  const buildRef = useRef(build);
  buildRef.current = build;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let app: Application | undefined;
    let controller: PixiStageController | void;
    let resizeObserver: ResizeObserver | null = null;

    const onVis = () => {
      if (!app) return;
      if (document.hidden || isPixiE2eEngineOff()) {
        app.ticker.stop();
      } else {
        app.ticker.start();
      }
    };

    void (async () => {
      try {
        const pixiMod = await import('pixi.js');
        if (disposed) return;
        const pixi: PixiModule = {
          Application: pixiMod.Application,
          Container: pixiMod.Container,
          Graphics: pixiMod.Graphics,
        };
        app = new pixi.Application();
        await app.init({
          resizeTo: host,
          backgroundAlpha: 0,
          antialias: true,
          resolution: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2),
          autoDensity: true,
        });
        if (disposed) {
          app.destroy(true, { children: true, texture: true });
          return;
        }
        app.ticker.maxFPS = CASINO_PIXI_MAX_FPS;
        if (isPixiE2eEngineOff()) {
          app.ticker.stop();
        }
        host.appendChild(app.canvas);
        appRef.current = app;
        controller = buildRef.current(app, pixi);
        setReady(true);

        resizeObserver = new ResizeObserver(() => {
          if (!app || disposed) return;
          controller?.onResize?.(app.screen.width, app.screen.height);
        });
        resizeObserver.observe(host);
        document.addEventListener('visibilitychange', onVis);
      } catch {
        if (!disposed) setReady(false);
      }
    })();

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVis);
      resizeObserver?.disconnect();
      controller?.destroy?.();
      controller = undefined;
      if (app) {
        try {
          app.destroy(true, { children: true, texture: true });
        } catch {
          // already torn down
        }
      }
      appRef.current = null;
      setReady(false);
    };
  }, [hostRef]);

  return { ready, appRef };
}
