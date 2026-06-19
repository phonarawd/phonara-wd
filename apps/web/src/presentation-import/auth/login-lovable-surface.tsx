import { PresentationRoot } from '../presentation-root';
import { ImportedLoginPage } from '../pages/login-page';
import { useLoginPageController } from '../../features/auth/use-login-page-controller';

export function LoginLovableSurface() {
  const controller = useLoginPageController();

  return (
    <PresentationRoot>
      <ImportedLoginPage engine={controller} />
    </PresentationRoot>
  );
}
