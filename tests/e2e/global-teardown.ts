import { finalizeE2eSession } from '../../scripts/lib/e2e-lifecycle';

export default async function globalTeardown(): Promise<void> {
  await finalizeE2eSession();
}
