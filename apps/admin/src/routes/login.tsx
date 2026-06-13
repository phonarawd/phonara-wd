import { createRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Route as rootRoute } from './__root';
import { useT } from '../lib/i18n';
import { signIn } from '../lib/auth';
import { AdminAuthBrand, AdminAuthFrame } from '../components/admin-auth-frame';
import { Button, Input } from '@phonara/ui';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const t = useT();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: authError } = await signIn(email, password);
    setSubmitting(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    void navigate({ to: '/overview' });
  }

  return (
    <AdminAuthFrame testId="admin-login-page">
      <AdminAuthBrand />
      <div className="space-y-1 text-center">
        <h1 className="admin-auth-brand-title">{t('admin.login.title')}</h1>
        <p className="admin-auth-brand-description">{t('admin.login.adminOnly')}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" data-testid="admin-login-form">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted" htmlFor="admin-email">
            {t('auth.email')}
          </label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="admin-email"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted" htmlFor="admin-password">
            {t('auth.password')}
          </label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="admin-password"
          />
        </div>

        {error && (
          <p className="text-sm text-down" data-testid="admin-login-error" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          full
          disabled={submitting}
          data-testid="admin-login-submit"
        >
          {submitting ? t('admin.login.signing') : t('admin.login.signIn')}
        </Button>
      </form>
    </AdminAuthFrame>
  );
}
