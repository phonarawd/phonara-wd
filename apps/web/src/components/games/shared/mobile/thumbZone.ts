/** Returns Tailwind classes that keep an element inside the bottom thumb zone. */
export function thumbZoneClass(): string {
  return "fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]";
}
