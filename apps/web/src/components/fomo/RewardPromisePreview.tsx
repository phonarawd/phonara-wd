import { motion } from "framer-motion";
import { Calendar, Target, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/motion";
import { t } from "@/i18n";

const items = [
  { icon: Calendar, key: "checkIn" as const, reward: "+1,000P" },
  { icon: Target, key: "daily" as const, reward: "+500P" },
  { icon: UserPlus, key: "invite" as const, reward: "+10,000P" },
];

export interface RewardPromisePreviewProps {
  className?: string;
}

export function RewardPromisePreview({ className }: RewardPromisePreviewProps) {
  return (
    <motion.ul
      variants={stagger(0.08)}
      initial="hidden"
      animate="show"
      className={cn("grid gap-2", className)}
      aria-label={t("fomo.promise.aria")}
    >
      {items.map(({ icon: Icon, key, reward }) => (
        <motion.li
          key={key}
          variants={fadeUp}
          className="flex items-center justify-between rounded-xl border border-border bg-(--color-surface) px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-(--color-primary)/15 text-(--color-primary)">
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="text-sm">{t(`fomo.promise.item.${key}` as const)}</span>
          </div>
          <span className="font-medium text-(--color-primary)">{reward}</span>
        </motion.li>
      ))}
    </motion.ul>
  );
}

