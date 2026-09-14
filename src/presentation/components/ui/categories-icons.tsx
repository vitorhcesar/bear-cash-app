import { useMemo } from "react";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";

import {
  CATEGORIES_CALENDAR_XML,
  CATEGORIES_CHEVRON_XML,
} from "@/presentation/components/ui/categories-icon-xml";

type IconProps = {
  size?: number;
  color?: string;
};

function tintFigmaIcon(xml: string, color: string) {
  return xml.replace(/#E0DFE2/gi, color);
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
    <View style={{ width: size, height: size, overflow: "hidden" }}>
      <SvgXml xml={tintedXml} width={size} height={size} />
    </View>
  );
}

export function CategoriesCalendarIcon({ size = 28, color }: IconProps) {
  return <FigmaIcon xml={CATEGORIES_CALENDAR_XML} size={size} color={color} />;
}

export function CategoriesChevronIcon({ size = 28, color }: IconProps) {
  return <FigmaIcon xml={CATEGORIES_CHEVRON_XML} size={size} color={color} />;
}
