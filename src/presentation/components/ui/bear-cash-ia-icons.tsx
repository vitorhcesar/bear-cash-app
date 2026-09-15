import {
  BEAR_CASH_IA_CHAT_XML,
  BEAR_CASH_IA_CLOSE_XML,
  BEAR_CASH_IA_PLUS_XML,
  BEAR_CASH_IA_SEND_XML,
} from "@/presentation/components/ui/bear-cash-ia-icon-xml";
import { FigmaSvgIcon } from "@/presentation/components/ui/figma-svg-icon";

type IconProps = {
  size?: number;
  color?: string;
};

export function BearCashIaCloseIcon({ size = 24, color }: IconProps) {
  return <FigmaSvgIcon xml={BEAR_CASH_IA_CLOSE_XML} size={size} color={color} />;
}

export function BearCashIaSendIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={BEAR_CASH_IA_SEND_XML} size={size} color={color} />;
}

export function BearCashIaChatIcon({ size = 24, color }: IconProps) {
  return <FigmaSvgIcon xml={BEAR_CASH_IA_CHAT_XML} size={size} color={color} />;
}

export function BearCashIaPlusIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={BEAR_CASH_IA_PLUS_XML} size={size} color={color} />;
}
