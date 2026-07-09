import { type ChildProcess } from 'node:child_process';
import { spawnSafe } from './lib/spawn-safe';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { PREVIEW_PORT, isPortBlocked, killPortListeners } from './lib/e2e-lifecycle';

const PREVIEW_HOST = '127.0.0.1';
const PREVIEW_URL = `http://${PREVIEW_HOST}:${PREVIEW_PORT}/home`;
const ACCESSIBILITY_MIN = 90;
const PERFORMANCE_ADVISORY_MIN = 80;
const PERF_HARD = process.env['PHONARA_LH_PERF_HARD'] === '1';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function spawnPreview(): ChildProcess {
  return spawnSafe(
    'bun',
    [
      '--filter',
      '@phonara/web',
      'preview',
      '--',
      '--host',
      PREVIEW_HOST,
      '--port',
      String(PREVIEW_PORT),
      '--strictPort',
    ],
    {
      stdio: 'ignore',
      detached: process.platform !== 'win32',
    },
  );
}

async function waitForPreviewReady(timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(PREVIEW_URL, { redirect: 'follow' });
      if (res.ok || res.status === 304) return;
    } catch {
      // preview still booting
    }
    await sleep(500);
  }
  throw new Error(`preview not ready at ${PREVIEW_URL} within ${timeoutMs}ms`);
}

async function stopPreview(preview: ChildProcess | null): Promise<void> {
  if (preview && !preview.killed) {
    preview.kill('SIGTERM');
    await sleep(400);
  }
  const killed = killPortListeners(PREVIEW_PORT);
  if (killed > 0) {
    process.stdout.write(
      `[lighthouse:once] killed ${killed} listener(s) on port ${PREVIEW_PORT}\n`,
    );
  }
  if (isPortBlocked(PREVIEW_PORT)) {
    throw new Error(`port ${PREVIEW_PORT} still blocked after preview teardown`);
  }
}

function scorePct(category: { score: number | null } | undefined): number {
  return Math.round((category?.score ?? 0) * 100);
}

function hasHostThrottleWarning(runWarnings: string[] | undefined): boolean {
  if (!runWarnings?.length) return false;
  return runWarnings.some((warning) =>
    /slow|benchmark|throttl|host|cpu|unreliable|inaccurate/i.test(warning),
  );
}

async function main(): Promise<void> {
  if (isPortBlocked(PREVIEW_PORT)) {
    process.stdout.write(`[lighthouse:once] clearing stale listener on port ${PREVIEW_PORT}\n`);
    killPortListeners(PREVIEW_PORT);
  }

  let preview: ChildProcess | null = null;
  let chrome: Awaited<ReturnType<typeof chromeLauncher.launch>> | null = null;

  try {
    preview = spawnPreview();
    await waitForPreviewReady();

    chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'] });
    const options = {
      logLevel: 'error' as const,
      output: 'json' as const,
      port: chrome.port,
      onlyCategories: ['performance', 'accessibility'] as const,
    };

    const runnerResult = await lighthouse(PREVIEW_URL, options);
    if (!runnerResult?.lhr) {
      throw new Error('lighthouse returned no report');
    }

    const perf = scorePct(runnerResult.lhr.categories.performance);
    const a11y = scorePct(runnerResult.lhr.categories.accessibility);
    const hostWarning = hasHostThrottleWarning(runnerResult.lhr.runWarnings);

    process.stdout.write(
      `[lighthouse:once] ${PREVIEW_URL}\n` +
        `  performance: ${perf} (advisory≥${PERFORMANCE_ADVISORY_MIN}${PERF_HARD ? ', hard gate ON' : ''})\n` +
        `  accessibility: ${a11y} (hard≥${ACCESSIBILITY_MIN})\n`,
    );

    if (hostWarning) {
      process.stdout.write(
        '[lighthouse:once] host throttle warning detected — performance score is host-dependent (advisory only)\n',
      );
    }

    if (a11y < ACCESSIBILITY_MIN) {
      process.stderr.write(`[lighthouse:once] FAIL accessibility ${a11y} < ${ACCESSIBILITY_MIN}\n`);
      process.exitCode = 1;
      return;
    }

    if (perf < PERFORMANCE_ADVISORY_MIN) {
      const msg = `[lighthouse:once] performance ${perf} < ${PERFORMANCE_ADVISORY_MIN}`;
      if (PERF_HARD) {
        process.stderr.write(`${msg} — FAIL (PHONARA_LH_PERF_HARD=1)\n`);
        process.exitCode = 1;
        return;
      }
      process.stdout.write(
        `${msg} — advisory (low-spec host may skew; set PHONARA_LH_PERF_HARD=1 on CI to hard-fail)\n`,
      );
    }

    process.stdout.write('[lighthouse:once] PASS (accessibility hard gate; PWA = check:pwa)\n');
  } finally {
    if (chrome) {
      try {
        await chrome.kill();
      } catch (error) {
        const code = error instanceof Error && 'code' in error ? String(error.code) : '';
        if (code === 'EPERM') {
          process.stdout.write(
            '[lighthouse:once] chrome temp cleanup EPERM on Windows — scores already recorded\n',
          );
        } else {
          process.stderr.write(
            `[lighthouse:once] chrome kill failed: ${error instanceof Error ? error.message : String(error)}\n`,
          );
        }
      }
    }
    await stopPreview(preview);
  }
}

await main();
