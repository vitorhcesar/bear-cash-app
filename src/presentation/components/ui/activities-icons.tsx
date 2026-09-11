import { useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import {
  BACK_ARROW_XML,
  EMPTY_PANDA_XML,
  EXPENSE_ARROW_XML,
  EYE_CLOSED_XML,
  EYE_OPEN_XML,
  FILTER_ICON_XML,
  INCOME_ARROW_XML,
  PLUS_ICON_XML,
  SEARCH_ICON_XML,
} from '@/presentation/components/ui/activities-icon-xml';

type IconProps = {
  size?: number;
  color?: string;
};

function tintFigmaIcon(xml: string, color: string) {
  return xml.replace(/#(?:E0E2DF|E0DFE2|585D56|373A36|63E29F|C33A22|FF2E31)/gi, color);
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

/** Left arrow used by the shared BackButton — not the Figma undo/reply glyph. */
export function BackArrowIcon({ size = 28, color }: IconProps) {
  return <FigmaIcon xml={BACK_ARROW_XML} size={size} color={color} />;
}

export function PlusIcon({ size = 24, color }: IconProps) {
  return <FigmaIcon xml={PLUS_ICON_XML} size={size} color={color} />;
}

export function SearchIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={SEARCH_ICON_XML} size={size} color={color} />;
}

export function FilterSlidersIcon({ size = 28, color }: IconProps) {
  return <FigmaIcon xml={FILTER_ICON_XML} size={size} color={color} />;
}

export function IncomeArrowIcon({ size = 12, color }: IconProps) {
  return <FigmaIcon xml={INCOME_ARROW_XML} size={size} color={color} />;
}

export function ExpenseArrowIcon({ size = 12, color }: IconProps) {
  return <FigmaIcon xml={EXPENSE_ARROW_XML} size={size} color={color} />;
}

export function EmptyActivityIcon({ size = 24, color }: IconProps) {
  return <FigmaIcon xml={EMPTY_PANDA_XML} size={size} color={color} />;
}

export function ActivityEyeOpenIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={EYE_OPEN_XML} size={size} color={color} />;
}

export function ActivityEyeClosedIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={EYE_CLOSED_XML} size={size} color={color} />;
}
