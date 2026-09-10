import Svg, { Path, Rect } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

export function SoundNoteIcon({ size = 20, color = '#CBCECA' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M8.5 14.5V5.2L15.5 3.5V12.2"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 14.5C8.5 15.6 7.6 16.5 6.5 16.5C5.4 16.5 4.5 15.6 4.5 14.5C4.5 13.4 5.4 12.5 6.5 12.5C7.6 12.5 8.5 13.4 8.5 14.5Z"
        stroke={color}
        strokeWidth={1.4}
      />
      <Path
        d="M15.5 12.2C15.5 13.3 14.6 14.2 13.5 14.2C12.4 14.2 11.5 13.3 11.5 12.2C11.5 11.1 12.4 10.2 13.5 10.2C14.6 10.2 15.5 11.1 15.5 12.2Z"
        stroke={color}
        strokeWidth={1.4}
      />
    </Svg>
  );
}

export function VibrationPhoneIcon({ size = 20, color = '#CBCECA' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Rect
        x={6.5}
        y={3.5}
        width={7}
        height={13}
        rx={1.5}
        stroke={color}
        strokeWidth={1.4}
      />
      <Path
        d="M4 6.5L2.5 8L4 9.5"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 6.5L17.5 8L16 9.5"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.2 11L2 12.2L3.2 13.4"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.8 11L18 12.2L16.8 13.4"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BellIcon({ size = 20, color = '#CBCECA' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M15.5 14.5H4.5L5.7 13.3C5.9 13.1 6 12.8 6 12.5V9C6 6.8 7.8 5 10 5C12.2 5 14 6.8 14 9V12.5C14 12.8 14.1 13.1 14.3 13.3L15.5 14.5Z"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 14.5V15C8.5 15.8 9.2 16.5 10 16.5C10.8 16.5 11.5 15.8 11.5 15V14.5"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}
