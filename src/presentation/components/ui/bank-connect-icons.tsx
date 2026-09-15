import {
  BANK_CONNECT_BUILDING_XML,
  BANK_CONNECT_CLOCK_XML,
  BANK_CONNECT_SWAP_XML,
  BEAR_CASH_CONNECT_LOGO_XML,
} from '@/presentation/components/ui/bank-connect-icon-xml';
import { FigmaSvgIcon } from '@/presentation/components/ui/figma-svg-icon';

type IconProps = {
  size?: number;
  color?: string;
};

export function BankConnectSwapIcon({ size = 24, color }: IconProps) {
  return <FigmaSvgIcon xml={BANK_CONNECT_SWAP_XML} size={size} color={color} />;
}

export function BankConnectBuildingIcon({ size = 12, color }: IconProps) {
  return <FigmaSvgIcon xml={BANK_CONNECT_BUILDING_XML} size={size} color={color} />;
}

export function BankConnectClockIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={BANK_CONNECT_CLOCK_XML} size={size} color={color} />;
}

export function BearCashConnectLogo({ size = 64 }: { size?: number }) {
  return <FigmaSvgIcon xml={BEAR_CASH_CONNECT_LOGO_XML} size={size} tint={false} />;
}
