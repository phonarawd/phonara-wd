import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { InstallPage } from '@/product/surfaces/install/install-page';

const useInstallPromptMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/pwa/install-prompt-context', () => ({
  useInstallPrompt: useInstallPromptMock,
}));

vi.mock('@/features/pwa/pwa-install', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/pwa/pwa-install')>();
  return {
    ...actual,
    detectPwaInstallPlatform: () => 'desktop' as const,
    dismissPwaInstallPrompt: vi.fn(),
  };
});

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

function renderPage() {
  useInstallPromptMock.mockReturnValue({
    canPrompt: false,
    isInstalled: false,
    promptInstall: vi.fn(),
  });

  return render(
    <I18nProvider>
      <InstallPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useInstallPromptMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('InstallPage', () => {
  it('renders install hero, benefits, and platform guide actions', () => {
    renderPage();

    expect(screen.getByTestId('install-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'PHONARA 앱 설치' })).toBeInTheDocument();
    expect(screen.getByText('PWA로 얻는 것')).toBeInTheDocument();
    expect(screen.getByTestId('install-primary-cta')).toBeInTheDocument();
    expect(screen.getByTestId('install-guide-ios')).toBeInTheDocument();
    expect(screen.getByTestId('install-guide-android')).toBeInTheDocument();
    expect(screen.getByTestId('install-guide-desktop')).toBeInTheDocument();
  });

  it('opens iOS manual install sheet from guide button', () => {
    renderPage();

    fireEvent.click(screen.getByTestId('install-guide-ios'));
    expect(screen.getByTestId('install-guide-sheet-ios')).toBeInTheDocument();
    expect(screen.getByTestId('install-ios-visual-guide')).toBeInTheDocument();
    expect(screen.getByTestId('install-ios-safari-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('install-guide-step-ios-1')).toBeInTheDocument();
    expect(screen.getByTestId('install-guide-step-ios-2')).toBeInTheDocument();
    expect(screen.getByTestId('install-guide-step-ios-3')).toBeInTheDocument();
    expect(
      screen.getByText('Safari 하단 가운데 공유 버튼(□↑)을 누르세요.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '반드시 Safari에서 진행하세요. Chrome·인앱 브라우저는 홈 화면 추가가 안 됩니다.',
      ),
    ).toBeInTheDocument();
  });

  it('shows relaunch CTA when already installed', () => {
    useInstallPromptMock.mockReturnValue({
      canPrompt: false,
      isInstalled: true,
      promptInstall: vi.fn(),
    });

    render(
      <I18nProvider>
        <InstallPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('install-relaunch')).toHaveAttribute('href', '/home');
    expect(screen.getByTestId('install-installed-label')).toBeInTheDocument();
  });

  it('triggers native prompt when available', async () => {
    const promptInstall = vi.fn().mockResolvedValue('accepted');
    useInstallPromptMock.mockReturnValue({
      canPrompt: true,
      isInstalled: false,
      promptInstall,
    });

    render(
      <I18nProvider>
        <InstallPage />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByTestId('install-primary-cta'));
    expect(promptInstall).toHaveBeenCalled();
  });
});
