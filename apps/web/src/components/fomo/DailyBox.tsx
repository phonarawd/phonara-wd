import { useState } from "react";
import { Gift } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { t } from "@/i18n";

export interface DailyBoxProps {
  /** Reward rolls (mock); a random one is picked on open. */
  rewards?: number[];
  alreadyOpened?: boolean;
  className?: string;
}

export function DailyBox({
  rewards = [100, 300, 500, 1000, 3000],
  alreadyOpened = false,
  className,
}: DailyBoxProps) {
  const [opened, setOpened] = useState(alreadyOpened);
  const [reward, setReward] = useState<number | null>(null);

  const open = () => {
    const r = rewards[Math.floor(Math.random() * rewards.length)] ?? rewards[0] ?? 0;
    setReward(r);
    setOpened(true);
    toast.success(t("fomo.daily.toast.collected", { amount: r.toLocaleString() }));
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-(--color-primary)/10 to-(--color-surface) p-5 text-center",
        className,
      )}
    >
      <motion.div
        animate={opened ? { rotate: [0, -8, 8, 0], scale: 1 } : { y: [0, -4, 0] }}
        transition={
          opened
            ? { duration: 0.5 }
            : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
        }
        className="mx-auto mb-3 grid size-16 place-items-center rounded-xl bg-(--color-primary)/15 text-(--color-primary)"
      >
        <Gift className="size-8" aria-hidden />
      </motion.div>
      <div className="text-sm font-medium">{t("fomo.daily.title")}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        {opened && reward
          ? t("fomo.daily.todayReward", { amount: reward.toLocaleString() })
          : t("fomo.daily.subtitle")}
      </div>
      <Button
        onClick={open}
        disabled={opened}
        className="mt-3 w-full"
        aria-label={t("fomo.daily.aria.open")}
      >
        {opened ? t("fomo.daily.cta.tomorrow") : t("fomo.daily.cta.open")}
      </Button>
    </div>
  );
}

