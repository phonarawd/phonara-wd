import { useEffect, useRef } from 'react';
import { CheckCircle2, Circle, IdCard, ShieldCheck } from 'lucide-react';

import {
  complianceStepHintKey,
  complianceStepMessageKey,
  kycDocumentHintKey,
  kycDocumentLabelKey,
  KYC_DOCUMENT_SLOTS,
} from '@/features/account/kyc-display';
import { useAccountKycController } from '@/features/account/use-account-kyc-controller';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { Input } from '@/product/primitives/input';
import { Skeleton } from '@/product/primitives/skeleton';
import { StatusBadge } from '@/product/primitives/status-badge';
import { cn } from '@/product/primitives/lib/cn';

function KycLoadingShell() {
  return (
    <div className="flex flex-col gap-4 py-4" data-testid="account-kyc-loading">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-56 w-full" />
    </div>
  );
}

/** Canonical `/account/kyc` — identity verification status + submission (P5). */
export function AccountKycPage() {
  const t = useT();
  const engine = useAccountKycController();
  const captureInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const uploadInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    document.title = t('seo.kyc.title');
  }, [t]);

  if (engine.loading) {
    return <KycLoadingShell />;
  }

  if (engine.errorKey) {
    return (
      <div
        className="border-danger/30 bg-surface flex flex-col items-start gap-3 rounded-(--ds-radius-lg) border p-4"
        data-testid="account-kyc-error"
        role="alert"
      >
        <p className="text-foreground m-0 text-sm">{t(engine.errorKey)}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void engine.refresh()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const submitDisabled =
    engine.submitBusy ||
    engine.legalNameGateKey !== null ||
    engine.documentLast4GateKey !== null ||
    engine.countryGateKey !== null ||
    !engine.allDocumentsReady;

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6" data-testid="account-kyc-page">
      <header className="space-y-3">
        <a
          href="/account"
          className="text-foreground-muted hover:text-foreground inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
        >
          {t('kyc.back')}
        </a>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
              {t('kyc.title')}
            </h1>
            <StatusBadge state={engine.statusBadgeState} label={t(engine.statusMessageKey)} />
          </div>
          <p className="text-foreground-muted m-0 text-sm">{t('kyc.subtitle')}</p>
        </div>
      </header>

      <Card data-testid="account-kyc-steps-card">
        <CardHeader className="flex flex-row items-start gap-3">
          <span
            className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-(--ds-radius-md)"
            aria-hidden
          >
            <ShieldCheck className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">{t('wallet.compliance.title')}</CardTitle>
            <CardDescription>{t('wallet.compliance.intro')}</CardDescription>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-3 pt-0">
          <ul className="m-0 flex list-none flex-col gap-3 p-0" data-testid="account-kyc-steps">
            {engine.complianceSteps.map((step) => (
              <li
                key={step.key}
                className="border-line flex gap-3 rounded-(--ds-radius-md) border px-3 py-3"
                data-testid={`account-kyc-step-${step.key}`}
              >
                {step.done ? (
                  <CheckCircle2 className="text-success mt-0.5 size-5 shrink-0" aria-hidden />
                ) : (
                  <Circle className="text-foreground-muted mt-0.5 size-5 shrink-0" aria-hidden />
                )}
                <div className="min-w-0 space-y-1">
                  <p className="text-foreground m-0 text-sm font-medium">
                    {t(complianceStepMessageKey(step.key))}
                  </p>
                  <p className="text-foreground-muted m-0 text-xs">
                    {t(complianceStepHintKey(step.key))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {engine.showSubmitForm ? (
        <Card data-testid="account-kyc-form-card">
          <CardHeader className="flex flex-row items-start gap-3">
            <span
              className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-(--ds-radius-md)"
              aria-hidden
            >
              <IdCard className="size-5" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <CardTitle className="text-base">{t('kyc.form.title')}</CardTitle>
              <CardDescription>{t('wallet.kyc.doc.intro')}</CardDescription>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-4 pt-0">
            {engine.statusMessageKey === 'kyc.status.rejected' ? (
              <p
                className="text-warning m-0 text-sm"
                role="status"
                data-testid="account-kyc-rejected-hint"
              >
                {t('kyc.rejectedHint')}
              </p>
            ) : null}

            <form
              onSubmit={(event) => void engine.handleSubmit(event)}
              noValidate
              className="flex flex-col gap-4"
              data-testid="account-kyc-form"
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="account-kyc-legal-name"
                  className="text-foreground text-sm font-medium"
                >
                  {t('wallet.kyc.legalName')}
                </label>
                <Input
                  id="account-kyc-legal-name"
                  type="text"
                  autoComplete="name"
                  value={engine.legalName}
                  disabled={engine.submitBusy}
                  aria-invalid={engine.legalNameGateKey !== null}
                  onChange={(event) => engine.setLegalName(event.target.value)}
                  data-testid="account-kyc-legal-name"
                />
                {engine.legalNameGateKey ? (
                  <p className="text-danger m-0 text-xs" role="alert">
                    {t(engine.legalNameGateKey)}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="account-kyc-document-last4"
                    className="text-foreground text-sm font-medium"
                  >
                    {t('wallet.kyc.documentLast4')}
                  </label>
                  <Input
                    id="account-kyc-document-last4"
                    type="text"
                    autoComplete="off"
                    inputMode="text"
                    maxLength={4}
                    value={engine.documentLast4}
                    disabled={engine.submitBusy}
                    aria-invalid={engine.documentLast4GateKey !== null}
                    onChange={(event) => engine.setDocumentLast4(event.target.value)}
                    data-testid="account-kyc-document-last4"
                  />
                  {engine.documentLast4GateKey ? (
                    <p className="text-danger m-0 text-xs" role="alert">
                      {t(engine.documentLast4GateKey)}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="account-kyc-country"
                    className="text-foreground text-sm font-medium"
                  >
                    {t('wallet.kyc.country')}
                  </label>
                  <Input
                    id="account-kyc-country"
                    type="text"
                    autoComplete="country"
                    maxLength={2}
                    value={engine.country}
                    disabled={engine.submitBusy}
                    aria-invalid={engine.countryGateKey !== null}
                    onChange={(event) => engine.setCountry(event.target.value)}
                    data-testid="account-kyc-country"
                  />
                  {engine.countryGateKey ? (
                    <p className="text-danger m-0 text-xs" role="alert">
                      {t(engine.countryGateKey)}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {KYC_DOCUMENT_SLOTS.map((slot) => {
                  const slotState = engine.documents[slot];
                  const inputId = `account-kyc-doc-${slot}`;
                  return (
                    <div
                      key={slot}
                      className="border-line flex flex-col gap-2 rounded-(--ds-radius-md) border p-3"
                      data-testid={`account-kyc-doc-${slot}`}
                    >
                      <div className="space-y-1">
                        <p className="text-foreground m-0 text-sm font-medium">
                          {t(kycDocumentLabelKey(slot))}
                        </p>
                        <p className="text-foreground-muted m-0 text-xs">
                          {t(kycDocumentHintKey(slot))}
                        </p>
                      </div>
                      {slotState.fileName ? (
                        <p
                          className="text-foreground-muted m-0 text-xs"
                          data-testid={`account-kyc-doc-name-${slot}`}
                        >
                          {slotState.fileName}
                        </p>
                      ) : null}
                      {slotState.errorKey ? (
                        <p className="text-danger m-0 text-xs" role="alert">
                          {t(slotState.errorKey)}
                        </p>
                      ) : null}
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          ref={(node) => {
                            captureInputRefs.current[slot] = node;
                          }}
                          id={`${inputId}-capture`}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          capture="environment"
                          className="sr-only"
                          disabled={engine.submitBusy || slotState.uploading}
                          onChange={(event) => void engine.handleDocumentSelect(slot, event)}
                        />
                        <input
                          ref={(node) => {
                            uploadInputRefs.current[slot] = node;
                          }}
                          id={`${inputId}-upload`}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          disabled={engine.submitBusy || slotState.uploading}
                          onChange={(event) => void engine.handleDocumentSelect(slot, event)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="sm:flex-1"
                          loading={slotState.uploading}
                          disabled={engine.submitBusy || slotState.uploading}
                          onClick={() => captureInputRefs.current[slot]?.click()}
                          data-testid={`account-kyc-doc-capture-${slot}`}
                        >
                          {t('wallet.kyc.doc.capture')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="sm:flex-1"
                          loading={slotState.uploading}
                          disabled={engine.submitBusy || slotState.uploading}
                          onClick={() => uploadInputRefs.current[slot]?.click()}
                          data-testid={`account-kyc-doc-upload-${slot}`}
                        >
                          {t('wallet.kyc.doc.upload')}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!engine.allDocumentsReady ? (
                <p className="text-foreground-muted m-0 text-xs">
                  {t('wallet.kyc.doc.allRequired')}
                </p>
              ) : null}

              <p className="text-foreground-muted m-0 text-xs">{t('kyc.slaHint')}</p>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
                loading={engine.submitBusy}
                disabled={submitDisabled}
                data-testid="account-kyc-submit"
              >
                {t('wallet.kyc.submit')}
              </Button>
            </form>
          </CardBody>
        </Card>
      ) : (
        <Card data-testid="account-kyc-status-card">
          <CardBody className="space-y-2">
            <p className="text-foreground m-0 text-sm font-medium">{t(engine.statusMessageKey)}</p>
            <p className="text-foreground-muted m-0 text-sm">{t('kyc.reviewHint')}</p>
          </CardBody>
        </Card>
      )}

      <Card className={cn('border-line/80 bg-surface/80')} data-testid="account-kyc-why-card">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <span
            className="text-foreground-muted flex size-10 shrink-0 items-center justify-center"
            aria-hidden
          >
            <ShieldCheck className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">{t('kyc.why.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="space-y-2 pt-0">
          <p className="text-foreground-muted m-0 text-sm">{t('kyc.why.body')}</p>
        </CardBody>
      </Card>
    </div>
  );
}
