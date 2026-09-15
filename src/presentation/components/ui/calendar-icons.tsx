import {
  CALENDAR_CHEVRON_DOWN_XML,
  CALENDAR_CHEVRON_LEFT_XML,
  CALENDAR_CHEVRON_RIGHT_XML,
} from '@/presentation/components/ui/calendar-icon-xml';
import { FigmaSvgIcon } from '@/presentation/components/ui/figma-svg-icon';

type IconProps = {
  size?: number;
  color?: string;
};

export function CalendarChevronLeftIcon({ size = 24, color }: IconProps) {
  return <FigmaSvgIcon xml={CALENDAR_CHEVRON_LEFT_XML} size={size} color={color} />;
}

export function CalendarChevronRightIcon({ size = 24, color }: IconProps) {
  return (
    <FigmaSvgIcon xml={CALENDAR_CHEVRON_RIGHT_XML} size={size} color={color} />
  );
}

export function CalendarChevronDownIcon({ size = 12, color }: IconProps) {
  return <FigmaSvgIcon xml={CALENDAR_CHEVRON_DOWN_XML} size={size} color={color} />;
}
