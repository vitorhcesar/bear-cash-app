import {
  CATEGORIES_CALENDAR_XML,
  CATEGORIES_CHEVRON_XML,
} from "@/presentation/components/ui/categories-icon-xml";
import { FigmaSvgIcon } from "@/presentation/components/ui/figma-svg-icon";

type IconProps = {
  size?: number;
  color?: string;
};

export function CategoriesCalendarIcon({ size = 28, color }: IconProps) {
  return <FigmaSvgIcon xml={CATEGORIES_CALENDAR_XML} size={size} color={color} />;
}

export function CategoriesChevronIcon({ size = 28, color }: IconProps) {
  return <FigmaSvgIcon xml={CATEGORIES_CHEVRON_XML} size={size} color={color} />;
}
