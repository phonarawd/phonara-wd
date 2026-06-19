import { useState, type FormEvent } from 'react';
import { sendPasswordReset } from '../../lib/auth';
import { authErrorMessageKey } from '../../lib/auth-error-key';
import { useT } from '../../lib/i18n';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useResetPasswordPageController() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setErrorMessage(t('shell.login.invalidEmail'));
      return;
    }
    setBusy(true);
    setErrorMessage(null);
    const result = await sendPasswordReset(email);
    setBusy(false);
    if (!result.ok) {
      setErrorMessage(t(authErrorMessageKey(result.code)));
      return;
    }
    setSent(true);
  }

  return {
    t,
    email,
    setEmail,
    sent,
    busy,
    errorMessage,
    submit,
  };
}
