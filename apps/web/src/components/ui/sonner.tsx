import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * PHONARA L1-09 Phase 6 polish · Toaster shell.
 * Per-type classNames (success / error / warning / info) make the default
 * `toast.success(...)` / `toast.error(...)` callsites pick up PHONARA accents
 * automatically — no callsite migration required (LOCK F10).
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      duration={2800}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:backdrop-blur-sm",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:border-primary/50 group-[.toaster]:text-foreground",
          error:
            "group-[.toaster]:border-destructive/60 group-[.toaster]:text-destructive",
          info: "group-[.toaster]:border-border/80",
          warning: "group-[.toaster]:border-gold/50 group-[.toaster]:text-gold",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
