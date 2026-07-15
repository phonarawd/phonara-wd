import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  DA_W6_DOMAIN_EMPTY_DOMAINS,
  DA_W6_DOMAIN_EMPTY_SIGNATURES,
  DA_W6_QUAD_STREAM_LOADING_AXES,
} from '@/domain/da-w6-brand-elevation-display-contract';
import {
  DA_W6_GATE_BRAND_DISTINGUISH_MARKERS,
  DA_W6_GATE_BRAND_SCAN_CUES,
} from '@/domain/da-w6-gate-brand-elevation-display-contract';
import { I18nProvider } from '@/product/i18n';
import { BrandMark } from '@/product/primitives/brand-mark';
import { DomainEmptyMark } from '@/product/primitives/domain-empty-mark';
import { EmptyState } from '@/product/primitives/empty-state';
import { QuadStreamLoading } from '@/product/primitives/quad-stream-loading';

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('da-w6-gate-brand-elevation · brand scan distinguish (§34.18–34.20 · YAML #217)', () => {
  it('keeps six brand scan cues unique so elevation artifacts do not collide', () => {
    const cues = Object.values(DA_W6_GATE_BRAND_SCAN_CUES);
    expect(new Set(cues).size).toBe(6);
    expect(DA_W6_GATE_BRAND_DISTINGUISH_MARKERS.brand_mark_aurora).toContain(
      'ds-brand-mark-aurora',
    );
    expect(DA_W6_GATE_BRAND_DISTINGUISH_MARKERS.quad_stream_loading).toContain(
      'ds-quad-stream-loading',
    );
  });

  it('renders brand-mark aurora · domain empties · Quad Stream with distinct markers', () => {
    const { container } = render(
      <I18nProvider>
        <div data-testid="da-w6-brand-board">
          <BrandMark variant="aurora" testId="gate-brand-aurora" />
          {DA_W6_DOMAIN_EMPTY_DOMAINS.map((domain) => (
            <EmptyState
              key={domain}
              domain={domain}
              title={domain}
              actionLabel="Go"
              onAction={() => undefined}
              testId={`gate-empty-${domain}`}
            />
          ))}
          <QuadStreamLoading testId="gate-quad-stream" />
        </div>
      </I18nProvider>,
    );

    const board = screen.getByTestId('da-w6-brand-board');
    const aurora = screen.getByTestId('gate-brand-aurora');
    expect(aurora).toHaveAttribute('data-brand-variant', 'aurora');
    expect(aurora.className).toContain('ds-brand-mark-aurora');
    expect(board.querySelector('.ds-brand-mark-aurora__glow')).toBeTruthy();

    for (const domain of DA_W6_DOMAIN_EMPTY_DOMAINS) {
      const empty = screen.getByTestId(`gate-empty-${domain}`);
      expect(empty).toHaveAttribute('data-domain', domain);
      const mark = empty.querySelector(`[data-domain="${domain}"]`);
      expect(mark).toHaveAttribute('data-signature', DA_W6_DOMAIN_EMPTY_SIGNATURES[domain]);
    }

    const loading = screen.getByTestId('gate-quad-stream');
    expect(loading.querySelector('.ds-quad-stream-loading')).toBeTruthy();
    for (const axis of DA_W6_QUAD_STREAM_LOADING_AXES) {
      expect(loading.querySelector(`[data-axis="${axis}"]`)).toBeTruthy();
    }

    // Primary owners must not share the same root marker class.
    expect(aurora.className).toContain('ds-brand-mark-aurora');
    expect(container.querySelectorAll('.ds-domain-empty-mark').length).toBe(4);
    expect(container.querySelectorAll('.ds-quad-stream-loading').length).toBe(1);
  });

  it('emits distinct DomainEmptyMark fingerprints for all four domains', () => {
    render(
      <>
        {DA_W6_DOMAIN_EMPTY_DOMAINS.map((domain) => (
          <DomainEmptyMark key={domain} domain={domain} testId={`scan-empty-${domain}`} />
        ))}
      </>,
    );

    const fingerprints = DA_W6_DOMAIN_EMPTY_DOMAINS.map((domain) => {
      const el = screen.getByTestId(`scan-empty-${domain}`);
      expect(el).toHaveAttribute('data-domain', domain);
      expect(el).toHaveAttribute('data-signature', DA_W6_DOMAIN_EMPTY_SIGNATURES[domain]);
      return el.getAttribute('data-signature');
    });

    expect(new Set(fingerprints).size).toBe(4);
  });
});
