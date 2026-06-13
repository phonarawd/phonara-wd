let colorProbe: HTMLSpanElement | null = null;
let canvasCtx: CanvasRenderingContext2D | null = null;

function getColorProbe(): HTMLSpanElement {
  colorProbe ??= document.createElement('span');
  colorProbe.style.display = 'none';
  return colorProbe;
}

function getCanvasCtx(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!canvasCtx) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    canvasCtx = canvas.getContext('2d', { willReadFrequently: true });
  }
  return canvasCtx;
}

function toHexByte(value: number): string {
  return value.toString(16).padStart(2, '0');
}

/** Convert any CSS color the browser understands into #rrggbb or rgba(). */
export function serializeCssColor(color: string, fallback = '#000000'): string {
  const value = color.trim();
  if (!value) return fallback;
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return value;
  if (/^rgba?\(/i.test(value)) return value;

  const ctx = getCanvasCtx();
  if (!ctx) return fallback;

  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, 1, 1);

  try {
    ctx.fillStyle = value;
  } catch {
    return fallback;
  }

  ctx.fillRect(0, 0, 1, 1);
  const pixel = ctx.getImageData(0, 0, 1, 1).data;
  const r = pixel[0] ?? 0;
  const g = pixel[1] ?? 0;
  const b = pixel[2] ?? 0;
  const a = pixel[3] ?? 0;
  if (a === 0) return fallback;
  if (a === 255) return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
  return `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 1000) / 1000})`;
}

const chartColorFallbacks: Partial<Record<`--${string}`, string>> = {
  '--color-fg': '#f2f2f5',
  '--color-muted': '#b8b8c7',
  '--color-surface': '#2a2a34',
  '--color-border-strong': 'rgba(72, 72, 88, 0.6)',
  '--color-up': '#3dd68c',
  '--color-down': '#f97066',
  '--color-primary': '#89f0cb',
};

/** Resolve a theme token to rgb()/rgba() or #hex for canvas/SVG consumers. */
export function resolveThemeColor(varName: `--${string}`, fallback?: string): string {
  const resolvedFallback = fallback ?? chartColorFallbacks[varName] ?? '#000000';
  if (typeof document === 'undefined') return resolvedFallback;

  const probe = getColorProbe();
  const root = document.documentElement;
  probe.style.color = '';
  probe.style.setProperty('color', `var(${varName})`);
  root.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();

  if (!computed) return resolvedFallback;

  const serialized = serializeCssColor(computed, resolvedFallback);
  if (/oklch|lab\(|lch\(/i.test(serialized)) return resolvedFallback;
  return serialized;
}
