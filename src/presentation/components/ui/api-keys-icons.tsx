import Svg, { Path, Rect } from 'react-native-svg';

import { useIconColor } from '@/presentation/components/ui/figma-svg-icon';
import { BearCashColors } from '@/presentation/constants/theme';

type IconProps = {
  size?: number;
  color?: string;
};

export function ApiKeyGlyphIcon({ size = 16, color }: IconProps) {
  color = useIconColor(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M7.2 8.8L13.2 2.8"
        stroke={color}
        strokeWidth={1.25}
        strokeLinecap="round"
      />
      <Path
        d="M11.4 4.6L12.8 6"
        stroke={color}
        strokeWidth={1.25}
        strokeLinecap="round"
      />
      <Path
        d="M12.2 3.8L13.4 5"
        stroke={color}
        strokeWidth={1.25}
        strokeLinecap="round"
      />
      <Path
        d="M6.2 9.8C7.5 11.1 7.5 13.2 6.2 14.5C4.9 15.8 2.8 15.8 1.5 14.5C0.2 13.2 0.2 11.1 1.5 9.8C2.8 8.5 4.9 8.5 6.2 9.8Z"
        stroke={color}
        strokeWidth={1.25}
      />
    </Svg>
  );
}

export function CopyIcon({ size = 16, color }: IconProps) {
  color = useIconColor(color ?? BearCashColors.buttonFilledText);
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Rect
        x={5.5}
        y={5.5}
        width={7}
        height={8}
        rx={1.2}
        stroke={color}
        strokeWidth={1.25}
      />
      <Path
        d="M3.5 10.5V3.7C3.5 3.04 4.04 2.5 4.7 2.5H10.5"
        stroke={color}
        strokeWidth={1.25}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function InfoCircleIcon({ size = 16, color = '#5B8DEF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 14.2C11.424 14.2 14.2 11.424 14.2 8C14.2 4.576 11.424 1.8 8 1.8C4.576 1.8 1.8 4.576 1.8 8C1.8 11.424 4.576 14.2 8 14.2Z"
        stroke={color}
        strokeWidth={1.25}
      />
      <Path
        d="M8 7.2V11"
        stroke={color}
        strokeWidth={1.25}
        strokeLinecap="round"
      />
      <Path
        d="M8 5.2H8.007"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CalendarIcon({ size = 16, color }: IconProps) {
  color = useIconColor(color ?? BearCashColors.textSoft);
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Rect
        x={2.5}
        y={3.5}
        width={11}
        height={10}
        rx={1.5}
        stroke={color}
        strokeWidth={1.25}
      />
      <Path d="M2.5 6.5H13.5" stroke={color} strokeWidth={1.25} />
      <Path
        d="M5.5 2.5V4.5"
        stroke={color}
        strokeWidth={1.25}
        strokeLinecap="round"
      />
      <Path
        d="M10.5 2.5V4.5"
        stroke={color}
        strokeWidth={1.25}
        strokeLinecap="round"
      />
    </Svg>
  );
}
