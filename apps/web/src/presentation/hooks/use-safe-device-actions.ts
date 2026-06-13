import { useCallback } from 'react';
import { useMounted } from './use-mounted';

type ShareInput = {
  title?: string;
  text?: string;
  url?: string;
};

type DeviceNavigator = Navigator & {
  clipboard?: Clipboard;
  share?: (input: ShareData) => Promise<void>;
  vibrate?: (pattern: VibratePattern) => boolean;
};

export function useSafeDeviceActions() {
  const mounted = useMounted();

  const vibrate = useCallback(
    (pattern: VibratePattern = 10) => {
      if (!mounted || typeof navigator === 'undefined') return false;
      const deviceNavigator = navigator as DeviceNavigator;
      return deviceNavigator.vibrate?.(pattern) ?? false;
    },
    [mounted],
  );

  const share = useCallback(
    async (input: ShareInput) => {
      if (!mounted || typeof navigator === 'undefined') return false;
      const deviceNavigator = navigator as DeviceNavigator;

      if (deviceNavigator.share) {
        await deviceNavigator.share(input);
        return true;
      }

      const text = [input.title, input.text, input.url].filter(Boolean).join('\n');
      if (!text || !deviceNavigator.clipboard) return false;

      await deviceNavigator.clipboard.writeText(text);
      return true;
    },
    [mounted],
  );

  return { mounted, vibrate, share };
}
