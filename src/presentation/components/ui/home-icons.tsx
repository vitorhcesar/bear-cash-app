import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import {
  HOME_CHEVRON_DOWN_12_XML,
  HOME_CHEVRON_XML,
  HOME_DASH_CARD_12_XML,
  HOME_DASH_INFLOW_12_XML,
  HOME_DASH_INFLOW_24_XML,
  HOME_DASH_INSTALLMENTS_12_XML,
  HOME_DASH_INSTALLMENTS_16_XML,
  HOME_DASH_OUTFLOW_24_XML,
  HOME_DASH_SUBSCRIPTIONS_XML,
  HOME_DASH_WALLET_12_XML,
  HOME_MAIL_XML,
  HOME_MASTERCARD_BRAND_XML,
  HOME_PLUS_12_XML,
  HOME_PLUS_16_XML,
  HOME_SHIELD_XML,
  HOME_SPARKLE_XML,
  HOME_WALLET_XML,
} from '@/presentation/components/ui/home-icon-xml';
import { FigmaSvgIcon } from '@/presentation/components/ui/figma-svg-icon';

type IconProps = {
  size?: number;
  color?: string;
};

export function HomeMailIcon({ size = 24, color }: IconProps) {
  return <FigmaSvgIcon xml={HOME_MAIL_XML} size={size} color={color} />;
}

export function HomeWalletIcon({ size = 24, color }: IconProps) {
  return <FigmaSvgIcon xml={HOME_WALLET_XML} size={size} color={color} />;
}

export function HomeShieldIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={HOME_SHIELD_XML} size={size} color={color} />;
}

export function HomeSparkleIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={HOME_SPARKLE_XML} size={size} color={color} />;
}

export function HomeChevronIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={HOME_CHEVRON_XML} size={size} color={color} />;
}

export function HomePlusIcon({ size = 16, color }: IconProps) {
  if (size <= 12) {
    return (
      <FigmaSvgIcon
        xml={HOME_PLUS_12_XML}
        size={size}
        color={color}
        box={12}
        glyphWidth={10.5179}
        glyphHeight={10.5179}
      />
    );
  }

  return <FigmaSvgIcon xml={HOME_PLUS_16_XML} size={size} color={color} />;
}

export function HomeChevronDownIcon({ size = 12, color }: IconProps) {
  return (
    <FigmaSvgIcon
      xml={HOME_CHEVRON_DOWN_12_XML}
      size={size}
      color={color}
      box={12}
      glyphWidth={7.75001}
      glyphHeight={3.75001}
    />
  );
}

export function HomeDashWalletIcon({ size = 12, color }: IconProps) {
  return <FigmaSvgIcon xml={HOME_DASH_WALLET_12_XML} size={size} color={color} />;
}

export function HomeDashInflowIcon({ size = 12, color }: IconProps) {
  if (size >= 24) {
    return (
      <FigmaSvgIcon xml={HOME_DASH_INFLOW_24_XML} size={size} color={color} />
    );
  }

  return <FigmaSvgIcon xml={HOME_DASH_INFLOW_12_XML} size={size} color={color} />;
}

export function HomeDashOutflowIcon({ size = 24, color }: IconProps) {
  return (
    <FigmaSvgIcon xml={HOME_DASH_OUTFLOW_24_XML} size={size} color={color} />
  );
}

export function HomeDashCardIcon({ size = 12, color }: IconProps) {
  return <FigmaSvgIcon xml={HOME_DASH_CARD_12_XML} size={size} color={color} />;
}

export function HomeDashInstallmentsIcon({ size = 12, color }: IconProps) {
  if (size >= 16) {
    return (
      <FigmaSvgIcon
        xml={HOME_DASH_INSTALLMENTS_16_XML}
        size={size}
        color={color}
      />
    );
  }

  return (
    <FigmaSvgIcon xml={HOME_DASH_INSTALLMENTS_12_XML} size={size} color={color} />
  );
}

export function HomeDashSubscriptionsIcon({ size = 12, color }: IconProps) {
  const box = size >= 16 ? 16 : 12;
  return (
    <FigmaSvgIcon
      xml={HOME_DASH_SUBSCRIPTIONS_XML}
      size={size}
      color={color}
      box={box}
      glyphWidth={14.3333}
      glyphHeight={11.6667}
    />
  );
}

export function MastercardBrandMark({
  width = 23.5,
  height = 16,
}: {
  width?: number;
  height?: number;
}) {
  return (
    <View style={{ width, height }}>
      <SvgXml xml={HOME_MASTERCARD_BRAND_XML} width={width} height={height} />
    </View>
  );
}
