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
import { FigmaSvgIcon } from '@/presentation/components/ui/figma-svg-icon';

type IconProps = {
  size?: number;
  color?: string;
};

/** Left arrow used by the shared BackButton — not the Figma undo/reply glyph. */
export function BackArrowIcon({ size = 28, color }: IconProps) {
  return <FigmaSvgIcon xml={BACK_ARROW_XML} size={size} color={color} />;
}

export function PlusIcon({ size = 24, color }: IconProps) {
  return <FigmaSvgIcon xml={PLUS_ICON_XML} size={size} color={color} />;
}

export function SearchIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={SEARCH_ICON_XML} size={size} color={color} />;
}

export function FilterSlidersIcon({ size = 28, color }: IconProps) {
  return <FigmaSvgIcon xml={FILTER_ICON_XML} size={size} color={color} />;
}

export function IncomeArrowIcon({ size = 12, color }: IconProps) {
  return <FigmaSvgIcon xml={INCOME_ARROW_XML} size={size} color={color} />;
}

export function ExpenseArrowIcon({ size = 12, color }: IconProps) {
  return <FigmaSvgIcon xml={EXPENSE_ARROW_XML} size={size} color={color} />;
}

export function EmptyActivityIcon({ size = 24, color }: IconProps) {
  return <FigmaSvgIcon xml={EMPTY_PANDA_XML} size={size} color={color} />;
}

export function ActivityEyeOpenIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={EYE_OPEN_XML} size={size} color={color} />;
}

export function ActivityEyeClosedIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={EYE_CLOSED_XML} size={size} color={color} />;
}
