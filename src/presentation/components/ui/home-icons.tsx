import { useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import {
  HOME_CHEVRON_XML,
  HOME_MAIL_XML,
  HOME_SHIELD_XML,
  HOME_SPARKLE_XML,
  HOME_WALLET_XML,
} from '@/presentation/components/ui/home-icon-xml';

type IconProps = {
  size?: number;
  color?: string;
};

function tintFigmaIcon(xml: string, color: string) {
  return xml.replace(/#(?:E0E2DF|373A36|0A0B0A)/gi, color);
}

function FigmaIcon({
  xml,
  size,
  color,
}: {
  xml: string;
  size: number;
  color?: string;
}) {
  const tintedXml = useMemo(
    () => (color ? tintFigmaIcon(xml, color) : xml),
    [xml, color],
  );

  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <SvgXml xml={tintedXml} width={size} height={size} />
    </View>
  );
}

export function HomeMailIcon({ size = 24, color }: IconProps) {
  return <FigmaIcon xml={HOME_MAIL_XML} size={size} color={color} />;
}

export function HomeWalletIcon({ size = 24, color }: IconProps) {
  return <FigmaIcon xml={HOME_WALLET_XML} size={size} color={color} />;
}

export function HomeShieldIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={HOME_SHIELD_XML} size={size} color={color} />;
}

export function HomeSparkleIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={HOME_SPARKLE_XML} size={size} color={color} />;
}

export function HomeChevronIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={HOME_CHEVRON_XML} size={size} color={color} />;
}
