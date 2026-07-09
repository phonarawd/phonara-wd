import { presentationKoMessages as ko } from '../../packages/i18n/src/locales/presentation-ko';

const shortcutIcon = [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }] as const;

/** PWA manifest user-facing copy — sourced from i18n catalog (default locale: ko). */
export const pwaManifestCopy = {
  description: ko['pwa.manifest.description'],
  shortcuts: [
    {
      name: ko['pwa.manifest.shortcut.earn.name'],
      short_name: ko['pwa.manifest.shortcut.earn.name'],
      description: ko['pwa.manifest.shortcut.earn.description'],
      url: '/home?source=shortcut',
      icons: shortcutIcon,
    },
    {
      name: ko['pwa.manifest.shortcut.wallet.name'],
      short_name: ko['pwa.manifest.shortcut.wallet.name'],
      description: ko['pwa.manifest.shortcut.wallet.description'],
      url: '/wallet?source=shortcut',
      icons: shortcutIcon,
    },
    {
      name: ko['pwa.manifest.shortcut.trade.name'],
      short_name: ko['pwa.manifest.shortcut.trade.name'],
      description: ko['pwa.manifest.shortcut.trade.description'],
      url: '/trade?source=shortcut',
      icons: shortcutIcon,
    },
    {
      name: ko['pwa.manifest.shortcut.casino.name'],
      short_name: ko['pwa.manifest.shortcut.casino.name'],
      description: ko['pwa.manifest.shortcut.casino.description'],
      url: '/casino?source=shortcut',
      icons: shortcutIcon,
    },
  ],
} as const;
