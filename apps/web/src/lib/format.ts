/**
 * Number / currency / percent formatters.
 * tabular-nums is set globally; these only normalize formatting.
 */

const krw = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});
const point = new Intl.NumberFormat("ko-KR");
const usdt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const fmtKRW = (n: number) => krw.format(n);
export const fmtPoint = (n: number) => point.format(n) + "P";
export const fmtUSDT = (n: number) => usdt.format(n);

export const fmtPrice = (n: number, digits = 1) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const fmtPct = (n: number, digits = 2) =>
  `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;

export const fmtSigned = (n: number, digits = 1) =>
  `${n >= 0 ? "+" : ""}${fmtPrice(n, digits)}`;

export const fmtCountdown = (ms: number) => {
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { d, h, m, s };
};

export const pad2 = (n: number) => n.toString().padStart(2, "0");
