/** Bidirectional compile-time check — frozen contract and hook return must match exactly. */
export type FreezeControllerView<Frozen, HookReturn> = HookReturn extends Frozen
  ? Frozen extends HookReturn
    ? true
    : never
  : never;
