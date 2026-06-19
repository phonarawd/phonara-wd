import { useEffect, useState } from "react";
import { toast } from "sonner";
import { t } from "@/i18n";
import { VelocityBridgeSheet } from "@/components/earn/VelocityBridgeSheet";

// Wave 3R — SurveyMock
// 3 static questions, deterministic. Reward = toast + localStorage flag.

const FLAG_KEY = "earn.micro.survey:v1";
const QUESTIONS = ["q1", "q2", "q3"] as const;

export function SurveyMock() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
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

  const submit = () => {
    if (done) return;
    if (Object.keys(answers).length < QUESTIONS.length) {
      toast(t("earn.micro.survey.incomplete"));
      return;
    }
    setDone(true);
    try {
      window.localStorage.setItem(FLAG_KEY, "1");
    } catch {
      // ignore
    }
    toast.success(t("earn.micro.survey.toast"));
    setBridgeOpen(true);
  };

  return (
    <div
      data-testid="micro-survey"
      className="mt-2 grid gap-2 rounded-md border border-border bg-(--color-surface) p-3 text-xs"
    >
      <div className="font-medium">{t("earn.micro.survey.title")}</div>
      {QUESTIONS.map((qid) => (
        <fieldset key={qid} className="grid gap-1">
          <legend className="text-[11px] text-muted-foreground">
            {t(`earn.micro.survey.${qid}`)}
          </legend>
          <div className="flex gap-2">
            {["a", "b"].map((opt) => (
              <label
                key={opt}
                className="flex flex-1 cursor-pointer items-center gap-1 rounded border border-border bg-(--color-surface-elev) px-2 py-1 text-[11px]"
              >
                <input
                  type="radio"
                  name={qid}
                  value={opt}
                  disabled={done}
                  checked={answers[qid] === opt}
                  onChange={() => setAnswers((a) => ({ ...a, [qid]: opt }))}
                />
                {t(`earn.micro.survey.${qid}.${opt}`)}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <button
        type="button"
        onClick={submit}
        disabled={done}
        className="min-h-10 rounded-md bg-(--color-primary) px-3 text-xs font-semibold text-(--color-primary-foreground) disabled:opacity-60"
      >
        {done ? t("earn.micro.survey.done") : t("earn.micro.survey.cta")}
      </button>
      <p className="text-[10px] text-muted-foreground/80">
        {t("earn.micro.survey.disclosure")}
      </p>
      {bridgeOpen && (
        <VelocityBridgeSheet open={bridgeOpen} onOpenChange={setBridgeOpen} source="survey" />
      )}
    </div>
  );
}
