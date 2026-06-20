import { formatMoney } from "@phonara/ui";

export type OrderTicketSummaryProps = {
  availLabel: string;
  availDisplay: string;
  openFeeDisplay?: string;
  liquidationDisplay?: string;
};

export function OrderTicketSummary({
  availLabel,
  availDisplay,
  openFeeDisplay,
  liquidationDisplay,
}: OrderTicketSummaryProps) {
  return (
    <div className="grid gap-1 rounded border border-border bg-(--color-surface) p-2 text-[11px] text-muted-foreground">
      <SummaryRow k={availLabel} v={availDisplay} />
      {openFeeDisplay ? <SummaryRow k="" v={openFeeDisplay} /> : null}
      {liquidationDisplay ? <SummaryRow k="" v={liquidationDisplay} /> : null}
    </div>
  );
}

export type OrderTicketSummaryFromPreviewProps = {
  avail: string;
  marginCurrency: "USDT" | "PHON";
  availLabel: string;
  openFeeLabel: string;
  liqLabel: string;
  preview?: {
    openFee: string;
    liquidationPrice: string;
  } | null;
};

export function OrderTicketSummaryFromPreview({
  avail,
  marginCurrency,
  availLabel,
  openFeeLabel,
  liqLabel,
  preview,
}: OrderTicketSummaryFromPreviewProps) {
  return (
    <div className="grid gap-1 rounded border border-border bg-(--color-surface) p-2 text-[11px] text-muted-foreground">
      <SummaryRow k={availLabel} v={formatMoney(avail, marginCurrency)} />
      {preview ? (
        <>
          <SummaryRow k={openFeeLabel} v={formatMoney(preview.openFee, marginCurrency)} />
          <SummaryRow k={liqLabel} v={formatMoney(preview.liquidationPrice, "USDT")} />
        </>
      ) : null}
    </div>
  );
}

function SummaryRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      {k ? <span>{k}</span> : <span />}
      <span className="tabular-nums text-right">{v}</span>
    </div>
  );
}
