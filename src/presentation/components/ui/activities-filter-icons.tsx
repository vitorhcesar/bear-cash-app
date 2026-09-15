import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import {
  FILTER_BB_XML,
  FILTER_CALENDAR_XML,
  FILTER_CHECKBOX_ON_XML,
  FILTER_CHEVRON_XML,
  FILTER_CHIP_CLOSE_XML,
  FILTER_NUBANK_MARK_XML,
  FILTER_SANTANDER_XML,
} from '@/presentation/components/ui/activities-filter-icon-xml';
import { FigmaSvgIcon } from '@/presentation/components/ui/figma-svg-icon';

type IconProps = {
  size?: number;
  color?: string;
};

export function FilterCalendarIcon({ size = 12, color }: IconProps) {
  return <FigmaSvgIcon xml={FILTER_CALENDAR_XML} size={size} color={color} />;
}

export function FilterChevronIcon({ size = 12, color }: IconProps) {
  return <FigmaSvgIcon xml={FILTER_CHEVRON_XML} size={size} color={color} />;
}

export function FilterCheckboxOnIcon({ size = 20 }: IconProps) {
  return <FigmaSvgIcon xml={FILTER_CHECKBOX_ON_XML} size={size} />;
}

export function FilterChipCloseIcon({ size = 12, color }: IconProps) {
  return <FigmaSvgIcon xml={FILTER_CHIP_CLOSE_XML} size={size} color={color} />;
}

export function SantanderLogo({ size = 24 }: IconProps) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
      <SvgXml xml={FILTER_SANTANDER_XML} width={size} height={size} />
    </View>
  );
}

export function BancoDoBrasilLogo({ size = 24 }: IconProps) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
      <SvgXml xml={FILTER_BB_XML} width={size} height={size} />
    </View>
  );
}

export function NubankLogo({ size = 24 }: IconProps) {
  const markWidth = (12.7096 / 24) * size;
  const markHeight = (7.01228 / 24) * size;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#820AD1',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <SvgXml xml={FILTER_NUBANK_MARK_XML} width={markWidth} height={markHeight} />
    </View>
  );
}
