import { Modal, Button } from "@phonara/ui";
import { t } from "@/i18n";
import { DEMO_PRIZE_AMOUNT } from "@/hooks/useGoldenEarthTap";

type GoldenEarthJackpotModalProps = {
  open: boolean;
  nth: number;
  onClose: () => void;
};

export function GoldenEarthJackpotModal({ open, nth, onClose }: GoldenEarthJackpotModalProps) {
  const titleId = "golden-earth-jackpot-title";
  const descId = "golden-earth-jackpot-desc";

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={descId}
      testId="golden-earth-jackpot-modal"
      className="max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
    >
      <h2 id={titleId} className="text-lg font-bold text-foreground">
        {t("earn.goldenEarth.jackpot.title")}
      </h2>
      <p id={descId} className="mt-2 text-sm text-muted-foreground">
        {t("earn.goldenEarth.jackpot.body", { nth })}
      </p>
      <p className="mt-3 text-2xl font-bold tabular-nums text-(--color-primary)">
        {t("earn.goldenEarth.jackpot.prizeExample", { amount: DEMO_PRIZE_AMOUNT })}
      </p>
      <Button type="button" className="mt-5 w-full" onClick={onClose}>
        {t("earn.goldenEarth.jackpot.cta")}
      </Button>
    </Modal>
  );
}

GoldenEarthJackpotModal.displayName = "GoldenEarthJackpotModal";
