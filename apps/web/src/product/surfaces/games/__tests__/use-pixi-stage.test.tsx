import { act, render, waitFor } from '@testing-library/react';
import { createRef, type RefObject } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PIXI_APP_DESTROY_OPTIONS,
  usePixiStage,
  type PixiStageController,
} from '@/product/surfaces/games/use-pixi-stage';

type DestroyCall = {
  removeView: unknown;
  options: unknown;
  at: number;
};

const destroyCalls: DestroyCall[] = [];
const controllerDestroyOrder: number[] = [];
let callSeq = 0;

vi.mock('pixi.js', () => {
  class MockApplication {
    canvas = document.createElement('canvas');
    ticker = {
      maxFPS: 60,
      stop: vi.fn(),
      start: vi.fn(),
    };
    screen = { width: 320, height: 180 };
    stage = { addChild: vi.fn() };

    async init() {
      return undefined;
    }

    destroy(removeView?: unknown, options?: unknown) {
      destroyCalls.push({ removeView, options, at: ++callSeq });
    }
  }
  class Container {
    addChild() {
      return this;
    }
    destroy() {}
  }
  class Graphics {
    clear() {
      return this;
    }
  }
  return {
    Application: MockApplication,
    Container,
    Graphics,
  };
});

function Host({
  hostRef,
  build,
}: {
  hostRef: RefObject<HTMLDivElement | null>;
  build: (app: unknown, pixi: unknown) => PixiStageController | void;
}) {
  usePixiStage(hostRef, build as never);
  return <div ref={hostRef} data-testid="pixi-host" />;
}

describe('usePixiStage disposal (phase1d-0-shared-pixi-hook-fix)', () => {
  beforeEach(() => {
    destroyCalls.length = 0;
    controllerDestroyOrder.length = 0;
    callSeq = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('exports full Pixi v8 destroy flags (textureSource · context)', () => {
    expect(PIXI_APP_DESTROY_OPTIONS).toEqual({
      children: true,
      texture: true,
      textureSource: true,
      context: true,
    });
  });

  it('destroys Application with full flags before controller.destroy', async () => {
    const hostRef = createRef<HTMLDivElement>();
    const build = () => ({
      destroy: () => {
        controllerDestroyOrder.push(++callSeq);
      },
    });

    const view = render(<Host hostRef={hostRef} build={build} />);

    await waitFor(() => {
      expect(hostRef.current?.querySelector('canvas')).toBeTruthy();
    });

    act(() => {
      view.unmount();
    });

    expect(destroyCalls).toHaveLength(1);
    expect(destroyCalls[0]?.removeView).toBe(true);
    expect(destroyCalls[0]?.options).toEqual({ ...PIXI_APP_DESTROY_OPTIONS });
    expect(controllerDestroyOrder).toHaveLength(1);
    expect(destroyCalls[0]!.at).toBeLessThan(controllerDestroyOrder[0]!);
  });
});
