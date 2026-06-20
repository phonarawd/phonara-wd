import { t } from "@/i18n";

const DEMO_FRIENDS: ReadonlyArray<{ nameKey: string; rank: number }> = [
  { nameKey: "earn.survival.friend.name1", rank: 1 },
  { nameKey: "earn.survival.friend.name2", rank: 3 },
  { nameKey: "earn.survival.friend.name3", rank: 5 },
  { nameKey: "earn.survival.friend.name4", rank: 7 },
  { nameKey: "earn.survival.friend.name5", rank: 9 },
];

export type SurvivalFriendRankingProps = {
  userRank: number | null;
};

export function SurvivalFriendRanking({ userRank }: SurvivalFriendRankingProps) {
  return (
    <section
      data-testid="survival-friend-ranking"
      aria-labelledby="survival-friends-title"
      className="rounded-lg border border-border bg-card/30 p-3"
    >
      <h3 id="survival-friends-title" className="text-sm font-semibold text-foreground">
        {t("earn.survival.friends.title")}
      </h3>
      <p className="mt-1 text-[10px] text-muted-foreground">{t("earn.survival.friends.disclaimer")}</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {userRank !== null && (
          <li className="rounded-md bg-(--color-primary)/10 px-2 py-1.5 text-sm font-medium tabular-nums">
            {t("earn.survival.friend.you", { rank: userRank })}
          </li>
        )}
        {DEMO_FRIENDS.map((friend) => (
          <li
            key={friend.nameKey}
            className="px-2 py-1 text-sm tabular-nums text-muted-foreground"
          >
            {t("earn.survival.friend.row", {
              name: t("earn.survival.friend.demoPrefix") + t(friend.nameKey),
              rank: friend.rank,
            })}
          </li>
        ))}
      </ul>
    </section>
  );
}

SurvivalFriendRanking.displayName = "SurvivalFriendRanking";
