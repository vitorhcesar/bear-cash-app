import Svg, { Circle, Path } from "react-native-svg";

import {
  BEAR_CASH_IA_CHAT_XML,
  BEAR_CASH_IA_CLOSE_XML,
  BEAR_CASH_IA_PLUS_XML,
  BEAR_CASH_IA_SEND_XML,
} from "@/presentation/components/ui/bear-cash-ia-icon-xml";
import { FigmaSvgIcon, useIconColor } from "@/presentation/components/ui/figma-svg-icon";

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

export function BearCashIaClockIcon({ size = 22, color }: IconProps) {
  const stroke = useIconColor(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" stroke={stroke} strokeWidth={1.5} />
      <Path
        d="M12 8v4.2l3 1.8"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
