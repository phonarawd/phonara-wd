import { PresentationRoot } from '../presentation-root';
import { ImportedResetPasswordPage } from '../pages/reset-password-page';
import { useResetPasswordPageController } from '../../features/auth/use-reset-password-page-controller';

export function ResetPasswordLovableSurface() {
  const controller = useResetPasswordPageController();

  return (
    <PresentationRoot>
      <ImportedResetPasswordPage engine={controller} />
    </PresentationRoot>
  );
}
