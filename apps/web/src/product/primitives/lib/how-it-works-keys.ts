import type { MessageKey } from '@phonara/i18n';

/** Build `{domain}.howItWorks.step{1..3}` keys (§30.2). */
export function howItWorksStepKeys(domain: string): readonly [MessageKey, MessageKey, MessageKey] {
  return [
    `${domain}.howItWorks.step1`,
    `${domain}.howItWorks.step2`,
    `${domain}.howItWorks.step3`,
  ] as [MessageKey, MessageKey, MessageKey];
}
