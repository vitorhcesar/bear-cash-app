import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, SvgXml } from 'react-native-svg';

import {
  APPLE_ICON_XML,
  EMAIL_ICON_XML,
  GOOGLE_ICON_XML,
} from '@/presentation/components/ui/auth-brand-icon-xml';

type IconProps = {
  size?: number;
  color?: string;
};

const DEFAULT_ICON_COLOR = '#E0DFE2';

function tintFigmaIcon(xml: string, color: string) {
  return xml.replace(/#E0DFE2/gi, color);
}

function FigmaBrandIcon({
  xml,
  size = 16,
  color,
  glyphWidth,
  glyphHeight,
}: {
  xml: string;
  size?: number;
  color?: string;
  glyphWidth: number;
  glyphHeight: number;
}) {
  const tintedXml = useMemo(
    () => (color ? tintFigmaIcon(xml, color) : xml),
    [xml, color],
  );
  const width = (glyphWidth / 16) * size;
  const height = (glyphHeight / 16) * size;

  return (
    <View
      style={{
        width: size,
        height: size,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <SvgXml xml={tintedXml} width={width} height={height} />
    </View>
  );
}

/** Apple mark exported from Figma Brand component */
export function AppleIcon({ size = 16, color }: IconProps) {
  return (
    <FigmaBrandIcon
      xml={APPLE_ICON_XML}
      size={size}
      color={color}
      glyphWidth={10.3138}
      glyphHeight={12.6667}
    />
  );
}

/** Google mark exported from Figma Brand component */
export function GoogleIcon({ size = 16 }: IconProps) {
  return (
    <FigmaBrandIcon xml={GOOGLE_ICON_XML} size={size} glyphWidth={16} glyphHeight={16} />
  );
}

/** Phone mark for SMS / phone-number login — matches brand icon size/style */
export function PhoneIcon({ size = 16, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M5.2 1.75H10.8C11.3 1.75 11.7 2.15 11.7 2.65V13.35C11.7 13.85 11.3 14.25 10.8 14.25H5.2C4.7 14.25 4.3 13.85 4.3 13.35V2.65C4.3 2.15 4.7 1.75 5.2 1.75Z"
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <Path
        d="M7.2 12.35H8.8"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Envelope mark for email entry toggle — matches Figma Login WhatsApp */
export function EmailIcon({ size = 16, color }: IconProps) {
  return (
    <FigmaBrandIcon
      xml={EMAIL_ICON_XML}
      size={size}
      color={color}
      glyphWidth={16}
      glyphHeight={16}
    />
  );
}
