const STORAGE_KEY = 'phonara.onboarding.completed.v1';

type OnboardingCompletionStore = Record<string, true>;

function readStore(): OnboardingCompletionStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return parsed as OnboardingCompletionStore;
  } catch {
    return {};
  }
}

function writeStore(store: OnboardingCompletionStore): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/** Per-user onboarding wizard completion (post-signup funnel). */
export function isOnboardingComplete(userId: string): boolean {
  return readStore()[userId] === true;
}

export function markOnboardingComplete(userId: string): void {
  const store = readStore();
  store[userId] = true;
  writeStore(store);
}

/** Test-only reset helper. */
export function clearOnboardingComplete(userId: string): void {
  const store = readStore();
  delete store[userId];
  writeStore(store);
}
