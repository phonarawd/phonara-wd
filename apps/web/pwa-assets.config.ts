import {
  combinePresetAndAppleSplashScreens,
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config';

/** --ds-bg dark theme solid (§25.8) — maskable/apple opaque backgrounds */
const DS_BG = '#0d0f14';

const preset = combinePresetAndAppleSplashScreens(
  {
    ...minimal2023Preset,
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[48, 'favicon.ico']],
      padding: 0.06,
      resizeOptions: { fit: 'contain', background: 'transparent' },
    },
    maskable: {
      sizes: [512],
      padding: 0.16,
      resizeOptions: { fit: 'contain', background: DS_BG },
    },
    apple: {
      sizes: [180],
      padding: 0.1,
      resizeOptions: { fit: 'contain', background: DS_BG },
    },
  },
  {
    padding: 0.24,
    resizeOptions: { fit: 'contain', background: DS_BG },
    linkMediaOptions: {
      log: true,
      basePath: '/',
    },
  },
  [
    'iPhone 16 Pro Max',
    'iPhone 16 Pro',
    'iPhone 15',
    'iPhone 14',
    'iPhone SE 4.7"',
    'iPad Pro 12.9"',
    'iPad Air 11"',
    'iPad mini 8.3"',
  ],
);

export default defineConfig({
  preset,
  headLinkOptions: {
    preset: '2023',
    basePath: '/',
  },
  /** §25.9 — raster from splash-mark (full-color 4-axis) · chrome uses logo-mono mask */
  images: ['public/brand/splash-mark.svg'],
});
