/** Dev-only stand-in for vite-plugin-pwa `virtual:pwa-register` (plugin is build-only). */
export function registerSW(options?: {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
}): () => void {
  void options;
  return () => {};
}
