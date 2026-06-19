import { cn } from "@/lib/utils";
import { t } from "@/i18n";

export interface ReferralNode {
  id: string;
  name: string;
  joinedAt: string;
  rewardP: number;
  children?: ReferralNode[];
}

export interface ReferralTreeProps {
  root: ReferralNode;
  className?: string;
}

function Node({ node, depth = 0 }: { node: ReferralNode; depth?: number }) {
  return (
    <li>
      <div
        className="flex items-center justify-between gap-3 rounded-md border border-border bg-(--color-surface) px-3 py-2"
        style={{ marginLeft: depth * 16 }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-(--color-primary)/15 text-xs text-(--color-primary)">
            {node.name.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{node.name}</div>
            <div className="text-[10px] text-muted-foreground">{node.joinedAt}</div>
          </div>
        </div>
        <span className="shrink-0 text-xs text-(--color-gold)">
          +{node.rewardP.toLocaleString()}P
        </span>
      </div>
      {node.children && node.children.length > 0 && (
        <ul className="mt-1 grid gap-1">
          {node.children.map((c) => (
            <Node key={c.id} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function ReferralTree({ root, className }: ReferralTreeProps) {
  return (
    <ul className={cn("grid gap-1", className)} aria-label={t("fomo.tree.aria.label")}>
      <Node node={root} />
    </ul>
  );
}
