import Svg, { Path } from "react-native-svg";

import {
  LGPD_CHECK_ICON_XML,
  OTP_ERROR_ICON_XML,
} from "@/presentation/components/ui/auth-hint-icon-xml";
import {
  FigmaSvgIcon,
  useIconColor,
} from "@/presentation/components/ui/figma-svg-icon";
import { BearCashColors } from "@/presentation/constants/theme";

type IconProps = {
  size?: number;
  color?: string;
};

/** Refresh/replace avatar control — Figma auth Step 4 */
export function RefreshIcon({ size = 12, color }: IconProps) {
  const stroke = useIconColor(color ?? BearCashColors.onText);
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path
        d="M9.5 3.5A4.2 4.2 0 0 0 2.4 5.2"
        stroke={stroke}
        strokeWidth={1.15}
        strokeLinecap="round"
      />
      <Path
        d="M2.2 2.8V5.2H4.6"
        stroke={stroke}
        strokeWidth={1.15}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2.5 8.5A4.2 4.2 0 0 0 9.6 6.8"
        stroke={stroke}
        strokeWidth={1.15}
        strokeLinecap="round"
      />
      <Path
        d="M9.8 9.2V6.8H7.4"
        stroke={stroke}
        strokeWidth={1.15}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Close (X) — avatar picker sheet */
export function CloseIcon({ size = 20, color }: IconProps) {
  const stroke = useIconColor(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M5 5L15 15M15 5L5 15"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** LGPD shield with check — Figma auth Step 4 */
export function ShieldCheckIcon({ size = 16, color = "#49dc14" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 1.333L3.333 3.333V7.333C3.333 10.2 5.24 12.853 8 13.667C10.76 12.853 12.667 10.2 12.667 7.333V3.333L8 1.333Z"
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <Path
        d="M5.833 7.667L7.167 9L10.167 6"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function OtpErrorIcon({ size = 16 }: { size?: number }) {
  return <FigmaSvgIcon xml={OTP_ERROR_ICON_XML} size={size} />;
}

export function LgpdCheckIcon({ size = 16 }: { size?: number }) {
  return <FigmaSvgIcon xml={LGPD_CHECK_ICON_XML} size={size} />;
}
