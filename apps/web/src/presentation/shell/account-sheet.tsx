import { AccountSheet as CurrentAccountSheet } from '../../components/shell/AccountSheet';

type PresentationAccountSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PresentationAccountSheet(props: PresentationAccountSheetProps) {
  return <CurrentAccountSheet {...props} />;
}
