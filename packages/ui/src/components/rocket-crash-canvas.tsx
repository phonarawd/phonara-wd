import { forwardRef, useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export type RocketCrashCanvasState = 'idle' | 'armed' | 'flying' | 'settled' | 'crashed';

export interface RocketCrashCanvasProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  multiplierLabel: ReactNode;
  targetLabel: ReactNode;
  target: ReactNode;
  statusLabel: ReactNode;
  seedHashLabel?: ReactNode;
  seedHash?: ReactNode;
  resultLabel?: ReactNode;
  result?: ReactNode;
  state?: RocketCrashCanvasState;
}

const PAD_L = 56;
const PAD_R = 40;
const PAD_T = 30;
const PAD_B = 50;
const Y_TICKS = ['1.5x', '2x', '3x', '5x', '10x', '20x'];

export const RocketCrashCanvas = forwardRef<HTMLDivElement, RocketCrashCanvasProps>(
  function RocketCrashCanvas(
    {
      title,
      multiplierLabel,
      targetLabel,
      target,
      statusLabel,
      seedHashLabel,
      seedHash,
      resultLabel,
      result,
      state = 'idle',
      className,
      ...props
    },
    ref,
  ) {
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const particleRef = useRef<HTMLCanvasElement | null>(null);
    const [size, setSize] = useState({ width: 800, height: 460 });
    const [progress, setProgress] = useState(state === 'idle' ? 0 : 0.72);
    const active = state === 'flying' || state === 'armed';
    const crashed = state === 'crashed';
    const settled = state === 'settled' || crashed;

    useEffect(() => {
      const element = wrapRef.current;
      if (!element) return;
      const resize = () => setSize({ width: element.clientWidth, height: element.clientHeight });
      resize();
      const observer = new ResizeObserver(resize);
      observer.observe(element);
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      if (!active) {
        setProgress(settled ? 0.86 : 0);
        return;
      }
      let frame = 0;
      const startedAt = performance.now();
      const animate = (time: number) => {
        const elapsed = time - startedAt;
        const next = Math.min(0.92, 0.18 + elapsed / 7200);
        setProgress(next);
        frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frame);
    }, [active, settled]);

    const innerWidth = Math.max(1, size.width - PAD_L - PAD_R);
    const innerHeight = Math.max(1, size.height - PAD_T - PAD_B);
    const eased = 1 - Math.pow(1 - progress, 2);
    const tipX = PAD_L + eased * innerWidth;
    const tipY = PAD_T + (1 - Math.min(0.92, progress * 1.08)) * innerHeight;
    const path = buildCurvePath(tipX, tipY, innerWidth, innerHeight);
    const canvasHeight = size.height;
    const canvasWidth = size.width;

    useEffect(() => {
      const canvas = particleRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      type Particle = { x: number; y: number; vx: number; vy: number; age: number; maxAge: number; tone: string; radius: number };
      const particles: Particle[] = [];
      let frame = 0;
      let burstDone = false;

      const spawn = (burst: boolean) => {
        const count = burst ? 64 : 2;
        for (let index = 0; index < count; index += 1) {
          const angle = burst ? Math.random() * Math.PI * 2 : Math.PI + (Math.random() - 0.5) * 0.6;
          const speed = burst ? 2 + Math.random() * 5 : 0.6 + Math.random() * 1.2;
          particles.push({
            x: tipX,
            y: tipY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - (burst ? 0 : 0.4),
            age: 0,
            maxAge: burst ? 58 + Math.random() * 34 : 30 + Math.random() * 18,
            tone: burst
              ? Math.random() < 0.5
                ? 'var(--color-rocket-danger)'
                : 'var(--color-rocket-gold)'
              : Math.random() < 0.5
                ? 'var(--color-rocket-magenta)'
                : 'var(--color-rocket-cyan)',
            radius: burst ? 2 + Math.random() * 3 : 1 + Math.random() * 2,
          });
        }
      };

      const draw = () => {
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        if (active) {
          burstDone = false;
          spawn(false);
        }
        if (crashed && !burstDone) {
          burstDone = true;
          spawn(true);
        }
        for (let index = particles.length - 1; index >= 0; index -= 1) {
          const particle = particles[index];
          if (!particle) continue;
          particle.age += 1;
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.05;
          particle.vx *= 0.985;
          if (particle.age > particle.maxAge) {
            particles.splice(index, 1);
            continue;
          }
          const alpha = 1 - particle.age / particle.maxAge;
          context.globalAlpha = alpha;
          context.fillStyle = particle.tone;
          context.shadowColor = particle.tone;
          context.shadowBlur = 10;
          context.beginPath();
          context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          context.fill();
        }
        context.globalAlpha = 1;
        context.shadowBlur = 0;
        frame = requestAnimationFrame(draw);
      };

      frame = requestAnimationFrame(draw);
      return () => cancelAnimationFrame(frame);
    }, [active, canvasHeight, canvasWidth, crashed, tipX, tipY]);

    return (
      <div
        ref={ref}
        className={cn(
          'rocket-glass-panel relative min-h-[420px] overflow-hidden rounded-2xl',
          crashed && 'rocket-crash-shake',
          className,
        )}
        {...props}
      >
        <div ref={wrapRef} className="relative h-full min-h-[420px] overflow-hidden">
          <div className="absolute inset-0 rocket-scanline-grid opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg" />
          <canvas
            ref={particleRef}
            className="pointer-events-none absolute inset-0"
            style={{ width: canvasWidth, height: canvasHeight }}
          />
          <svg width={canvasWidth} height={canvasHeight} className="absolute inset-0" role="presentation" aria-hidden="true">
            <defs>
              <linearGradient id="rocketCurveGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--color-rocket-magenta)" />
                <stop offset="100%" stopColor="var(--color-rocket-cyan)" />
              </linearGradient>
              <linearGradient id="rocketCurveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--color-rocket-magenta)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--color-rocket-cyan)" stopOpacity="0" />
              </linearGradient>
              <filter id="rocketCurveGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {Y_TICKS.map((tick, index) => {
              const y = PAD_T + (1 - (index + 1) / (Y_TICKS.length + 1)) * innerHeight;
              return (
                <g key={tick}>
                  <line
                    x1={PAD_L}
                    x2={canvasWidth - PAD_R}
                    y1={y}
                    y2={y}
                    stroke="var(--color-border)"
                    strokeDasharray="3 6"
                    strokeOpacity="0.36"
                  />
                  <text x={PAD_L - 8} y={y + 4} textAnchor="end" fill="var(--color-muted)" fontSize="11">
                    {tick}
                  </text>
                </g>
              );
            })}
            <line
              x1={PAD_L}
              x2={canvasWidth - PAD_R}
              y1={PAD_T + innerHeight}
              y2={PAD_T + innerHeight}
              stroke="var(--color-border)"
              strokeOpacity="0.6"
            />
            {progress > 0 ? (
              <>
                <path
                  d={`${path} L ${tipX} ${PAD_T + innerHeight} L ${PAD_L} ${PAD_T + innerHeight} Z`}
                  fill="url(#rocketCurveFill)"
                  opacity={crashed ? 0.42 : 1}
                />
                <path
                  d={path}
                  fill="none"
                  stroke={crashed ? 'var(--color-rocket-danger)' : 'url(#rocketCurveGradient)'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  filter="url(#rocketCurveGlow)"
                />
                <g transform={`translate(${tipX}, ${tipY}) rotate(-18)`} style={{ filter: 'var(--rocket-glow-ship)' }}>
                  {crashed ? <CrashMark /> : <RocketShip />}
                </g>
              </>
            ) : null}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-3 rounded-full border border-[color-mix(in_srgb,var(--color-rocket-cyan)_42%,transparent)] bg-surface/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-rocket-cyan)]">
              {statusLabel}
            </div>
            <div className={cn('rocket-tick-up text-[clamp(3rem,9vw,7rem)] font-black leading-none tracking-[-0.08em]', settled ? 'rocket-text-glow-gold text-[var(--color-rocket-gold)]' : 'rocket-text-gradient rocket-text-glow-cyan')}>
              {multiplierLabel}
            </div>
            <div className="mt-4 grid w-full max-w-xl gap-3 sm:grid-cols-2">
              <InfoPill label={targetLabel} value={target} />
              {seedHashLabel && seedHash ? <InfoPill label={seedHashLabel} value={seedHash} mono /> : null}
            </div>
          </div>

          <div className="absolute left-4 top-4 max-w-[calc(100%-2rem)]">
            <h3 className="text-sm font-semibold text-fg">{title}</h3>
          </div>

          {resultLabel && result ? (
            <div className="absolute inset-x-4 bottom-4 rounded-xl border border-[color-mix(in_srgb,var(--color-rocket-gold)_34%,transparent)] bg-bg/70 px-3 py-2 text-sm shadow-[var(--rocket-shadow-gold)]">
              <span className="text-muted">{resultLabel}</span>
              <span className="ml-2 font-semibold text-fg">{result}</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  },
);

RocketCrashCanvas.displayName = 'RocketCrashCanvas';

function buildCurvePath(tipX: number, tipY: number, innerWidth: number, innerHeight: number) {
  const startY = PAD_T + innerHeight;
  const segments = 36;
  let d = `M ${PAD_L} ${startY}`;
  for (let index = 1; index <= segments; index += 1) {
    const localProgress = index / segments;
    const x = PAD_L + localProgress * (tipX - PAD_L);
    const lift = Math.pow(localProgress, 1.72) * (startY - tipY);
    const y = startY - lift;
    d += ` L ${x} ${y}`;
  }
  return d;
}

function InfoPill({ label, value, mono = false }: { label: ReactNode; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl border border-border/70 bg-surface/70 px-3 py-2 text-left shadow-[var(--surface-highlight)]">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn('mt-1 truncate font-bold text-fg', mono && 'font-mono text-xs')}>{value}</p>
    </div>
  );
}

function RocketShip() {
  return (
    <svg width="54" height="34" viewBox="0 0 54 34" aria-hidden="true">
      <path d="M4 22 22 6c7-6 18-4 28 2-5 10-13 17-24 17L12 30l4-8H4Z" fill="var(--color-rocket-cyan)" />
      <path d="M22 6c7-6 18-4 28 2-2 4-5 8-8 11L16 22 4 22Z" fill="var(--color-rocket-magenta)" opacity="0.72" />
      <circle cx="34" cy="14" r="4" fill="var(--color-rocket-bg)" opacity="0.92" />
      <path d="M8 23 0 28l10 1Z" fill="var(--color-rocket-gold)" />
    </svg>
  );
}

function CrashMark() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <path
        d="M22 2 27 15 41 10 32 22 42 32 28 29 22 42 16 29 2 32 12 22 3 10 17 15Z"
        fill="var(--color-rocket-danger)"
      />
      <path d="M16 16 28 28M28 16 16 28" stroke="var(--color-fg)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
