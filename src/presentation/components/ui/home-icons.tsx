import { useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import {
  HOME_CHEVRON_DOWN_12_XML,
  HOME_CHEVRON_XML,
  HOME_DASH_INFLOW_12_XML,
  HOME_DASH_INSTALLMENTS_12_XML,
  HOME_DASH_SUBSCRIPTIONS_XML,
  HOME_DASH_WALLET_12_XML,
  HOME_MAIL_XML,
  HOME_PLUS_12_XML,
  HOME_PLUS_16_XML,
  HOME_SHIELD_XML,
  HOME_SPARKLE_XML,
  HOME_WALLET_XML,
} from '@/presentation/components/ui/home-icon-xml';

type IconProps = {
  size?: number;
  color?: string;
};

function tintFigmaIcon(xml: string, color: string) {
  return xml.replace(/#(?:E0E2DF|373A36|0A0B0A|E0DFE2|212022|F5F4F5)/gi, color);
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

function LeafIcon({
  xml,
  box,
  leafWidth,
  leafHeight,
  size,
  color,
}: {
  xml: string;
  box: number;
  leafWidth: number;
  leafHeight: number;
  size: number;
  color?: string;
}) {
  const tintedXml = useMemo(
    () => (color ? tintFigmaIcon(xml, color) : xml),
    [xml, color],
  );
  const scale = size / box;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <SvgXml
        xml={tintedXml}
        width={leafWidth * scale}
        height={leafHeight * scale}
      />
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

export function HomePlusIcon({ size = 16, color }: IconProps) {
  if (size <= 12) {
    return (
      <LeafIcon
        xml={HOME_PLUS_12_XML}
        box={12}
        leafWidth={10.5179}
        leafHeight={10.5179}
        size={size}
        color={color}
      />
    );
  }

  return <FigmaIcon xml={HOME_PLUS_16_XML} size={size} color={color} />;
}

export function HomeChevronDownIcon({ size = 12, color }: IconProps) {
  return (
    <LeafIcon
      xml={HOME_CHEVRON_DOWN_12_XML}
      box={12}
      leafWidth={7.75001}
      leafHeight={3.75001}
      size={size}
      color={color}
    />
  );
}

export function HomeDashWalletIcon({ size = 12, color }: IconProps) {
  return <FigmaIcon xml={HOME_DASH_WALLET_12_XML} size={size} color={color} />;
}

export function HomeDashInflowIcon({ size = 12, color }: IconProps) {
  return <FigmaIcon xml={HOME_DASH_INFLOW_12_XML} size={size} color={color} />;
}

export function HomeDashInstallmentsIcon({ size = 12, color }: IconProps) {
  return (
    <FigmaIcon xml={HOME_DASH_INSTALLMENTS_12_XML} size={size} color={color} />
  );
}

export function HomeDashSubscriptionsIcon({ size = 12, color }: IconProps) {
  return (
    <LeafIcon
      xml={HOME_DASH_SUBSCRIPTIONS_XML}
      box={12}
      leafWidth={14.3333}
      leafHeight={11.6667}
      size={size}
      color={color}
    />
  );
}
