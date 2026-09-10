import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, SvgXml } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

const PROFILE_TRASH_XML =
  '<svg overflow="visible" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">\n<g id="Icon">\n<path id="Vector" d="M10.2502 3H1.75012" stroke="#59565D" stroke-width="0.75" stroke-linecap="round"/>\n<path id="Vector_2" d="M9.41634 4.25L9.18637 7.69956C9.09787 9.02701 9.05363 9.69074 8.62112 10.0954C8.18862 10.5 7.52342 10.5 6.19301 10.5H5.80633C4.47593 10.5 3.81073 10.5 3.37823 10.0954C2.94572 9.69074 2.90148 9.02701 2.81298 7.69956L2.58301 4.25" stroke="#59565D" stroke-width="0.75" stroke-linecap="round"/>\n<path id="Vector_3" opacity="0.5" d="M4.75012 5.50003L5.00012 8.00003" stroke="#E0DFE2" stroke-width="0.75" stroke-linecap="round"/>\n<path id="Vector_4" opacity="0.5" d="M7.25012 5.50003L7.00012 8.00003" stroke="#E0DFE2" stroke-width="0.75" stroke-linecap="round"/>\n<path id="Vector_5" opacity="0.5" d="M3.25012 3C3.27806 3 3.29203 3 3.3047 2.99968C3.71642 2.98925 4.07963 2.72745 4.21973 2.34016C4.22404 2.32825 4.22846 2.31499 4.23729 2.28849L4.28584 2.14286C4.32728 2.01854 4.348 1.95638 4.37548 1.9036C4.48513 1.69304 4.68799 1.54682 4.92243 1.50938C4.98119 1.5 5.04671 1.5 5.17775 1.5H6.82249C6.95354 1.5 7.01906 1.5 7.07782 1.50938C7.31225 1.54682 7.51512 1.69304 7.62476 1.9036C7.65225 1.95638 7.67297 2.01854 7.71441 2.14286L7.76295 2.28849C7.77178 2.31496 7.77621 2.32825 7.78051 2.34016C7.92061 2.72745 8.28383 2.98925 8.69555 2.99968C8.70821 3 8.72218 3 8.75012 3" stroke="#E0DFE2" stroke-width="0.75"/>\n</g>\n</svg>';

/** Green verified check badge used in profile contact fields */
export function VerifiedBadgeIcon({
  size = 16,
  color = '#49dc14',
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle cx={8} cy={8} r={7.25} fill={color} />
      <Path
        d="M4.8 8.2L6.9 10.2L11.2 5.8"
        stroke="#0A0B0A"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Trash can from Figma Perfil (12px leaf). */
export function TrashIcon({ size = 12, color }: IconProps) {
  const xml = useMemo(
    () => (color ? PROFILE_TRASH_XML.replace(/#59565D|#E0DFE2/gi, color) : PROFILE_TRASH_XML),
    [color],
  );

  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}
