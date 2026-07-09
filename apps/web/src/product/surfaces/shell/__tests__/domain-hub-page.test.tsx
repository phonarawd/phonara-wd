import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { I18nProvider } from '@/product/i18n';

import { DomainHubPage } from '../domain-hub-page';

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('DomainHubPage', () => {
  it('renders sparse P6 domain hub stub with title only', () => {
    render(
      <I18nProvider>
        <DomainHubPage titleKey="nav.sports" testId="sports-hub-page" />
      </I18nProvider>,
    );

    expect(screen.getByTestId('sports-hub-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '스포츠' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
