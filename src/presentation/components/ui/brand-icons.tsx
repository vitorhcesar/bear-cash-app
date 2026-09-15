import Svg, { Path } from 'react-native-svg';

import {
  APPLE_ICON_XML,
  EMAIL_ICON_XML,
  GOOGLE_ICON_XML,
} from '@/presentation/components/ui/auth-brand-icon-xml';
import { FigmaSvgIcon, useIconColor } from '@/presentation/components/ui/figma-svg-icon';

type IconProps = {
  size?: number;
  color?: string;
};

/** Apple mark exported from Figma Brand component */
export function AppleIcon({ size = 16, color }: IconProps) {
  return (
    <FigmaSvgIcon
      xml={APPLE_ICON_XML}
      size={size}
      color={color}
      box={16}
      glyphWidth={10.3138}
      glyphHeight={12.6667}
    />
  );
}

/** Google mark exported from Figma Brand component */
export function GoogleIcon({ size = 16 }: IconProps) {
  return (
    <FigmaSvgIcon
      xml={GOOGLE_ICON_XML}
      size={size}
      box={16}
      glyphWidth={16}
      glyphHeight={16}
      tint={false}
    />
  );
}

/** Phone mark for SMS / phone-number login — matches brand icon size/style */
export function PhoneIcon({ size = 16, color }: IconProps) {
  const stroke = useIconColor(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M5.2 1.75H10.8C11.3 1.75 11.7 2.15 11.7 2.65V13.35C11.7 13.85 11.3 14.25 10.8 14.25H5.2C4.7 14.25 4.3 13.85 4.3 13.35V2.65C4.3 2.15 4.7 1.75 5.2 1.75Z"
        stroke={stroke}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <Path
        d="M7.2 12.35H8.8"
        stroke={stroke}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Envelope mark for email entry toggle — matches Figma Login WhatsApp */
export function EmailIcon({ size = 16, color }: IconProps) {
  return (
    <FigmaSvgIcon
      xml={EMAIL_ICON_XML}
      size={size}
      color={color}
      box={16}
      glyphWidth={16}
      glyphHeight={16}
    />
  );
}
