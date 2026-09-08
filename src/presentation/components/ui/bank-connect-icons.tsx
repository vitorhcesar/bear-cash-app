import { useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import {
  BANK_CONNECT_BUILDING_XML,
  BANK_CONNECT_CLOCK_XML,
  BANK_CONNECT_SWAP_XML,
  OTTO_CONNECT_LOGO_XML,
} from '@/presentation/components/ui/bank-connect-icon-xml';

type IconProps = {
  size?: number;
  color?: string;
};

function tintFigmaIcon(xml: string, color: string) {
  return xml.replace(/#(?:E0E2DF|585D56)/gi, color);
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

export function BankConnectSwapIcon({ size = 24, color }: IconProps) {
  return <FigmaIcon xml={BANK_CONNECT_SWAP_XML} size={size} color={color} />;
}

export function BankConnectBuildingIcon({ size = 12, color }: IconProps) {
  return <FigmaIcon xml={BANK_CONNECT_BUILDING_XML} size={size} color={color} />;
}

export function BankConnectClockIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={BANK_CONNECT_CLOCK_XML} size={size} color={color} />;
}

export function OttoConnectLogo({ size = 64 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <SvgXml xml={OTTO_CONNECT_LOGO_XML} width={size} height={size} />
    </View>
  );
}
