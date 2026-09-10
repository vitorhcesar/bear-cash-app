import Svg, { Path } from 'react-native-svg';

type TimerIconProps = {
  size?: number;
  color?: string;
};

/** Clock icon for resend countdown (matches Figma auth Step 2) */
export function TimerIcon({ size = 16, color = '#78737d' }: TimerIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 1.333A6.667 6.667 0 1 0 8 14.667 6.667 6.667 0 0 0 8 1.333Zm0 12A5.333 5.333 0 1 1 8 2.667a5.333 5.333 0 0 1 0 10.666Z"
        fill={color}
      />
      <Path
        d="M8.333 4.667H7.333V8.333L10.5 10.233L11 9.4L8.333 7.833V4.667Z"
        fill={color}
      />
    </Svg>
  );
}
