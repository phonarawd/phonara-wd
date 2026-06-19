import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { toast } from "sonner";

export interface EarlyAccessCodeInputProps {
  /** Codes that "unlock" a demo bonus message. */
  validCodes?: string[];
  className?: string;
}

export function EarlyAccessCodeInput({
  validCodes = ["PHONARA", "EARLY", "INVITE"],
  className,
}: EarlyAccessCodeInputProps) {
  const [code, setCode] = useState("");
  const apply = () => {
    const ok = validCodes.includes(code.trim().toUpperCase());
    if (ok) toast.success(t("fomo.early.success"));
    else toast.error(t("fomo.early.invalid"));
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className={cn("flex gap-2", className)}
    >
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={t("fomo.code.placeholder")}
        aria-label={t("fomo.code.placeholder")}
        className="h-11"
      />
      <Button type="submit" variant="secondary" className="h-11">
        {t("fomo.code.apply")}
      </Button>
    </form>
  );
}
