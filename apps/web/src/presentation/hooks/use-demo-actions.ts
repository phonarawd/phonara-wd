import { useCallback } from 'react';
import { toast } from 'sonner';
import { useSafeDeviceActions } from './use-safe-device-actions';

type FeedbackOptions = {
  message: string;
  withConfetti?: boolean;
  withHaptics?: boolean;
};

export function useDemoActions() {
  const { vibrate } = useSafeDeviceActions();

  const showFeedback = useCallback(
    async ({ message, withConfetti = false, withHaptics = false }: FeedbackOptions) => {
      if (withHaptics) {
        vibrate(10);
      }

      if (withConfetti) {
        const { default: confetti } = await import('canvas-confetti');
        confetti({
          particleCount: 80,
          spread: 58,
          origin: { y: 0.72 },
          ticks: 180,
        });
      }

      toast(message);
    },
    [vibrate],
  );

  return { showFeedback };
}
