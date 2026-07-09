import type { ReactNode } from 'react';

import { useT } from '@/product/i18n';
import { Switch } from '@/product/primitives/switch';
import { cn } from '@/product/primitives/lib/cn';

export type SignupConsentState = {
  age: boolean;
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
};

export function signupConsentsComplete(consents: SignupConsentState): boolean {
  return consents.age && consents.terms && consents.privacy;
}

function ConsentLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="text-accent underline-offset-4 hover:underline">
      {children}
    </a>
  );
}

type SignupConsentPanelProps = {
  value: SignupConsentState;
  onChange: (next: SignupConsentState) => void;
  disabled?: boolean;
};

export function SignupConsentPanel({ value, onChange, disabled }: SignupConsentPanelProps) {
  const t = useT();

  const setAll = (checked: boolean) => {
    onChange({
      age: checked,
      terms: checked,
      privacy: checked,
      marketing: checked,
    });
  };

  const allChecked = value.age && value.terms && value.privacy && value.marketing;

  return (
    <fieldset
      className="border-line bg-surface-raised flex flex-col gap-3 rounded-(--ds-radius-md) border p-3"
      disabled={disabled}
    >
      <legend className="text-foreground px-1 text-sm font-medium">
        {t('auth.entry.signup.consent.legend')}
      </legend>

      <label className="text-foreground flex cursor-pointer items-center gap-2 text-sm font-medium">
        <Switch
          checked={allChecked}
          onCheckedChange={setAll}
          disabled={disabled}
          aria-label={t('auth.entry.signup.consent.all')}
        />
        {t('auth.entry.signup.consent.all')}
      </label>

      <ConsentRow
        checked={value.age}
        onCheckedChange={(age) => onChange({ ...value, age })}
        disabled={disabled}
        label={t('auth.entry.signup.consent.age')}
      />
      <ConsentRow
        checked={value.terms}
        onCheckedChange={(terms) => onChange({ ...value, terms })}
        disabled={disabled}
        label={t('auth.entry.signup.consent.terms')}
        href="/legal/terms"
        viewLabel={t('auth.entry.signup.consent.view')}
      />
      <ConsentRow
        checked={value.privacy}
        onCheckedChange={(privacy) => onChange({ ...value, privacy })}
        disabled={disabled}
        label={t('auth.entry.signup.consent.privacy')}
        href="/legal/privacy"
        viewLabel={t('auth.entry.signup.consent.view')}
      />
      <ConsentRow
        checked={value.marketing}
        onCheckedChange={(marketing) => onChange({ ...value, marketing })}
        disabled={disabled}
        label={t('auth.entry.signup.consent.marketing')}
      />
    </fieldset>
  );
}

function ConsentRow({
  checked,
  onCheckedChange,
  disabled,
  label,
  href,
  viewLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  href?: string;
  viewLabel?: string;
}) {
  return (
    <label className={cn('text-foreground-muted flex cursor-pointer items-start gap-2 text-sm')}>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="mt-0.5"
        aria-label={label}
      />
      <span>
        {label}
        {href && viewLabel ? (
          <>
            {' '}
            <ConsentLink href={href}>{viewLabel}</ConsentLink>
          </>
        ) : null}
      </span>
    </label>
  );
}
