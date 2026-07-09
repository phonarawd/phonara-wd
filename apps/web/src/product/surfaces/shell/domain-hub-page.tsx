import { useT } from '@/product/i18n';
import type { MessageKey } from '@phonara/i18n';

export type DomainHubPageProps = {
  titleKey: MessageKey;
  testId: string;
};

/** Sparse authenticated hub — P8–P10 surfaces replace body content. */
export function DomainHubPage({ titleKey, testId }: DomainHubPageProps) {
  const t = useT();

  return (
    <section data-testid={testId} className="flex flex-col gap-2">
      <h1 className="text-foreground m-0 text-2xl font-semibold">{t(titleKey)}</h1>
    </section>
  );
}
