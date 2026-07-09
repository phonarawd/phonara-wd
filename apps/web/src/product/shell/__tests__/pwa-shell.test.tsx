import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const registerSWMock = vi.hoisted(() => vi.fn());
const notifyPwaSwUpdateReadyMock = vi.hoisted(() => vi.fn());

vi.mock('virtual:pwa-register', () => ({
  registerSW: registerSWMock,
}));

vi.mock('@/features/pwa/pwa-sw-update', () => ({
  notifyPwaSwUpdateReady: notifyPwaSwUpdateReadyMock,
}));

vi.mock('@/features/pwa/install-prompt-context', () => ({
  InstallPromptProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../pwa-install-banner', () => ({
  PwaInstallBanner: () => null,
}));

import { PwaShell } from '../pwa-shell';

describe('PwaShell', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    registerSWMock.mockReset();
    notifyPwaSwUpdateReadyMock.mockReset();
  });

  it('registers SW in production and routes onNeedRefresh through notifyPwaSwUpdateReady (§3.4)', () => {
    const applyUpdate = vi.fn();
    registerSWMock.mockReturnValue(applyUpdate);
    vi.stubEnv('PROD', 'true');

    render(<PwaShell />);

    expect(registerSWMock).toHaveBeenCalledTimes(1);
    const { onNeedRefresh } = registerSWMock.mock.calls[0]![0] as {
      onNeedRefresh: () => void;
    };
    onNeedRefresh();
    expect(notifyPwaSwUpdateReadyMock).toHaveBeenCalledTimes(1);

    const reload = notifyPwaSwUpdateReadyMock.mock.calls[0]![0] as () => void;
    reload();
    expect(applyUpdate).toHaveBeenCalledWith(true);
  });

  it('skips SW registration in dev', () => {
    vi.stubEnv('PROD', '');

    render(<PwaShell />);

    expect(registerSWMock).not.toHaveBeenCalled();
  });
});
