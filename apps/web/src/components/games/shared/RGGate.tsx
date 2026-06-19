import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export type RGReason =
  | "daily_loss_limit"
  | "session_time"
  | "self_exclusion"
  | "deposit_limit"
  | "kyc_required";

const COPY: Record<RGReason, { title: string; body: string }> = {
  daily_loss_limit: {
    title: "오늘의 손실 한도에 도달했어요",
    body: "더 이상 베팅할 수 없도록 잠시 멈췄어요. 내일 자정 이후 다시 시도하거나, 한도를 재설정할 수 있어요.",
  },
  session_time: {
    title: "세션 시간 알림",
    body: "오랜 시간 플레이 중이에요. 잠시 쉬어가시는 건 어떨까요?",
  },
  self_exclusion: {
    title: "자기제외 기간",
    body: "자기제외를 신청하셨어요. 기간이 종료된 후 다시 이용할 수 있어요.",
  },
  deposit_limit: {
    title: "입금 한도 초과",
    body: "설정한 입금 한도에 도달했어요. 한도를 조정하려면 책임게임 설정으로 이동하세요.",
  },
  kyc_required: {
    title: "신원 확인이 필요해요",
    body: "이 금액 이상은 신원 확인 완료 후 베팅할 수 있어요.",
  },
};

export interface RGGateProps {
  open: boolean;
  reason: RGReason | null;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export function RGGate({ open, reason, onClose, onOpenSettings }: RGGateProps) {
  const r = reason ?? "session_time";
  const c = COPY[r];
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mb-2 grid size-10 place-items-center rounded-full bg-(--color-warn)/15">
            <ShieldAlert className="size-5 text-(--color-warn)" />
          </div>
          <DialogTitle>{c.title}</DialogTitle>
          <DialogDescription>{c.body}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          {onOpenSettings && (
            <Button onClick={onOpenSettings}>한도 설정 열기</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
