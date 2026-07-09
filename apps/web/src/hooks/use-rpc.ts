import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import {
  callRpc,
  type RpcArgs,
  type RpcCallPayload,
  type RpcError,
  type RpcName,
  type RpcReturns,
} from '../lib/rpc';
import { productToast } from '@/product/primitives/toast-zone';

type RpcMutationOptions<N extends RpcName> = Omit<
  UseMutationOptions<RpcReturns<N>, RpcError, RpcCallPayload<N>>,
  'mutationFn'
> & {
  /** Show a translated strict toast on failure. Defaults to false — surface controllers own feedback (§3.4). */
  toastOnError?: boolean;
};

/**
 * TanStack Query mutation bound to a typed PostgREST RPC. Errors arrive as
 * {@link RpcError} with a stable code; opt-in toast surfaces via productToast.
 */
export function useRpc<N extends RpcName>(fn: N, options?: RpcMutationOptions<N>) {
  const { toastOnError = false, onError, ...rest } = options ?? {};

  return useMutation<RpcReturns<N>, RpcError, RpcCallPayload<N>>({
    mutationFn: (args) => {
      if (args === undefined) {
        return (callRpc as (name: N) => Promise<RpcReturns<N>>)(fn);
      }
      return (callRpc as (name: N, payload: RpcArgs<N>) => Promise<RpcReturns<N>>)(fn, args);
    },
    onError: (...args) => {
      const error = args[0];
      if (toastOnError) {
        productToast.show({ zone: 'strict', key: error.i18nKey });
      }
      return onError?.(...args);
    },
    ...rest,
  });
}
