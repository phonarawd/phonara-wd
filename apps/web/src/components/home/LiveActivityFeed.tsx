import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/i18n";
import { useEffect, useState } from "react";

/**
 * Phase 12-F · Home FOMO v0.1 — LiveActivityFeed
 * Rolling ticker of recent wins / point claims. Mock-only (no PHONARA wire).
 */
type Row = { id: number; user: string; action: string; amount: string };

const MOCK: Row[] = [
  { id: 1, user: "yuna**", action: "live.action.win", amount: "+128,400P" },
  { id: 2, user: "minho*", action: "live.action.checkin", amount: "+1,000P" },
  { id: 3, user: "soo***", action: "live.action.mission", amount: "+5,500P" },
  { id: 4, user: "kj***", action: "live.action.referral", amount: "+10,000P" },
  { id: 5, user: "park**", action: "live.action.win", amount: "+42,100P" },
  { id: 6, user: "lee***", action: "live.action.checkin", amount: "+1,000P" },
  { id: 7, user: "han**", action: "live.action.mission", amount: "+3,200P" },
  { id: 8, user: "choi*", action: "live.action.win", amount: "+87,600P" },
];

export function LiveActivityFeed() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setOffset((o) => (o + 1) % MOCK.length), 2200);
    return () => clearInterval(id);
  }, []);
  const visible = [...MOCK.slice(offset), ...MOCK.slice(0, offset)].slice(0, 4);

  return (
    <Card data-hub-id="home-live-feed">
      <CardContent className="grid gap-2 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t("home.fomo.live.title")}</h3>
          <span className="text-[10px] uppercase tracking-wider text-emerald-500">
            ● {t("home.fomo.live.badge")}
          </span>
        </div>
        <ul className="grid gap-1.5">
          {visible.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between text-xs text-muted-foreground"
            >
              <span className="truncate">
                <span className="font-medium text-foreground">{row.user}</span>{" "}
                {t(row.action)}
              </span>
              <span className="font-mono text-emerald-500">{row.amount}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
