import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { t } from "@/i18n";

export interface WheelOfFortuneProps {
  className?: string;
  disabled?: boolean;
  /** Engine-backed spin — when set, mock random slice is skipped. */
  onEngineSpin?: () => Promise<{ won: boolean; value: number } | null>;
  /** Wave 4.5 — fires after toast inside the same 4200ms block. Skipped when disabled or already spinning. */
  onSpinEnd?: (r: { won: boolean; value: number }) => void;
}

export function WheelOfFortune({ className, disabled, onEngineSpin, onSpinEnd }: WheelOfFortuneProps) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const slices = [
    { label: "100P", value: 100, color: "#00F5C0" },
    { label: "300P", value: 300, color: "#4DABFF" },
    { label: t("fomo.wheel.slice.miss"), value: 0, color: "#15181D" },
    { label: "500P", value: 500, color: "#F5C84C" },
    { label: "1KP", value: 1000, color: "#B388FF" },
    { label: t("fomo.wheel.slice.miss"), value: 0, color: "#15181D" },
    { label: "5KP", value: 5000, color: "#FF4D6D" },
    { label: "200P", value: 200, color: "#00D69A" },
  ];

  const spin = () => {
    if (spinning || disabled) return;
    setSpinning(true);

    const finishSpin = (reward: { won: boolean; value: number }) => {
      window.setTimeout(() => {
        setSpinning(false);
        onSpinEnd?.(reward);
      }, 4200);
    };

    if (onEngineSpin) {
      const segAngle = 360 / slices.length;
      void (async () => {
        const engineResult = await onEngineSpin();
        const value = engineResult?.value ?? 0;
        const won = engineResult?.won ?? false;
        const idx = Math.max(
          0,
          slices.findIndex((slice) => slice.value === value),
        );
        const target = 360 * 6 + (360 - idx * segAngle - segAngle / 2);
        setRotation((r) => r + target);
        finishSpin({ won, value });
      })();
      return;
    }

    const idx = Math.floor(Math.random() * slices.length);
    const segAngle = 360 / slices.length;
    const target = 360 * 6 + (360 - idx * segAngle - segAngle / 2);
    setRotation((r) => r + target);
    window.setTimeout(() => {
      setSpinning(false);
      const reward = slices[idx] ?? slices[0]!;
      if (reward.value > 0)
        toast.success(
          t("fomo.wheel.toast.win", { n: reward.value.toLocaleString() }),
        );
      else toast(t("fomo.wheel.toast.miss"));
      onSpinEnd?.({ won: reward.value > 0, value: reward.value });
    }, 4200);
  };

  const seg = 360 / slices.length;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative size-48">
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
          <div className="size-0 border-x-[8px] border-t-[14px] border-x-transparent border-t-(--color-primary)" />
        </div>
        <motion.svg
          viewBox="0 0 200 200"
          className="size-48 drop-shadow-[0_0_24px_rgb(0,245,192,0.25)]"
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.16, 1, 0.3, 1] }}
          role="img"
          aria-label={t("fomo.wheel.aria.wheel")}
        >
          {slices.map((s, i) => {
            const start = (i * seg - 90) * (Math.PI / 180);
            const end = ((i + 1) * seg - 90) * (Math.PI / 180);
            const x1 = 100 + 100 * Math.cos(start);
            const y1 = 100 + 100 * Math.sin(start);
            const x2 = 100 + 100 * Math.cos(end);
            const y2 = 100 + 100 * Math.sin(end);
            const mid = (i * seg + seg / 2 - 90) * (Math.PI / 180);
            const tx = 100 + 60 * Math.cos(mid);
            const ty = 100 + 60 * Math.sin(mid);
            return (
              <g key={i}>
                <path
                  d={`M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`}
                  fill={s.color}
                  stroke="#0A0B0E"
                  strokeWidth="1"
                />
                <text
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight="500"
                  fill={s.value === 0 ? "#8A9099" : "#0A0B0E"}
                  transform={`rotate(${(i * seg + seg / 2)}, ${tx}, ${ty})`}
                >
                  {s.label}
                </text>
              </g>
            );
          })}
          <circle cx="100" cy="100" r="14" fill="#15181D" stroke="#00F5C0" strokeWidth="2" />
        </motion.svg>
      </div>
      <Button
        onClick={spin}
        disabled={spinning || disabled}
        className="w-32"
        aria-label={t("fomo.wheel.aria.spin")}
      >
        {t(spinning ? "fomo.wheel.btn.spinning" : "fomo.wheel.btn.spin")}
      </Button>
    </div>
  );
}
