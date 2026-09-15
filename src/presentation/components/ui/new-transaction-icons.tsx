import {
  TRANSACTION_CALENDAR_XML,
  TRANSACTION_CARD_XML,
  TRANSACTION_CHEVRON_DOWN_XML,
  TRANSACTION_CHEVRON_RIGHT_XML,
  TRANSACTION_PENCIL_XML,
  TRANSACTION_TRASH_XML,
  TRANSACTION_EYE_XML,
} from '@/presentation/components/ui/new-transaction-icon-xml';
import { FigmaSvgIcon } from '@/presentation/components/ui/figma-svg-icon';

type IconProps = {
  size?: number;
  color?: string;
};

export function TransactionCalendarIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={TRANSACTION_CALENDAR_XML} size={size} color={color} />;
}

export function TransactionChevronDownIcon({ size = 16, color }: IconProps) {
  return (
    <FigmaSvgIcon xml={TRANSACTION_CHEVRON_DOWN_XML} size={size} color={color} />
  );
}

export function TransactionPencilIcon({ size = 24, color }: IconProps) {
  return <FigmaSvgIcon xml={TRANSACTION_PENCIL_XML} size={size} color={color} />;
}

export function TransactionChevronRightIcon({ size = 24, color }: IconProps) {
  return (
    <FigmaSvgIcon xml={TRANSACTION_CHEVRON_RIGHT_XML} size={size} color={color} />
  );
}

export function TransactionCardIcon({ size = 24, color }: IconProps) {
  return <FigmaSvgIcon xml={TRANSACTION_CARD_XML} size={size} color={color} />;
}

export function TransactionTrashIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={TRANSACTION_TRASH_XML} size={size} color={color} />;
}

export function TransactionEyeIcon({ size = 12, color }: IconProps) {
  return <FigmaSvgIcon xml={TRANSACTION_EYE_XML} size={size} color={color} />;
}
