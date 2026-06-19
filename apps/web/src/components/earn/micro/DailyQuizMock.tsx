import { useEffect, useState } from "react";
import { toast } from "sonner";
import { t } from "@/i18n";
import { VelocityBridgeSheet } from "@/components/earn/VelocityBridgeSheet";

// Wave 3R — DailyQuizMock
// 1 static question, deterministic correct answer. Reward = toast + flag.

const FLAG_KEY = "earn.micro.quiz:v1";
const CORRECT = "b";

export function DailyQuizMock() {
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [bridgeOpen, setBridgeOpen] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage.getItem(FLAG_KEY)) {
        setDone(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const choose = (opt: string) => {
    if (done) return;
    setPicked(opt);
    const isCorrect = opt === CORRECT;
    if (isCorrect) {
      setDone(true);
      try {
        window.localStorage.setItem(FLAG_KEY, "1");
      } catch {
        // ignore
      }
      toast.success(t("earn.micro.quiz.toast"));
      setBridgeOpen(true);
    } else {
      toast(t("earn.micro.quiz.tryAgain"));
    }
  };

  return (
    <div
      data-testid="micro-quiz"
      className="mt-2 grid gap-2 rounded-md border border-border bg-(--color-surface) p-3 text-xs"
    >
      <div className="font-medium">{t("earn.micro.quiz.title")}</div>
      <p className="text-[11px] text-muted-foreground">
        {t("earn.micro.quiz.question")}
      </p>
      <div className="flex gap-2">
        {(["a", "b", "c"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => choose(opt)}
            disabled={done}
            className="min-h-10 flex-1 rounded-md border border-border bg-(--color-surface-elev) px-2 text-[11px] disabled:opacity-60"
          >
            {t(`earn.micro.quiz.opt.${opt}`)}
          </button>
        ))}
      </div>
      {picked && (
        <p className="text-[10px] text-muted-foreground">
          {done
            ? t("earn.micro.quiz.correct")
            : t("earn.micro.quiz.tryAgain")}
        </p>
      )}
      <p className="text-[10px] text-muted-foreground/80">
        {t("earn.micro.quiz.disclosure")}
      </p>
      {bridgeOpen && (
        <VelocityBridgeSheet open={bridgeOpen} onOpenChange={setBridgeOpen} source="quiz" />
      )}
    </div>
  );
}
