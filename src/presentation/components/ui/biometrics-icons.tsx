import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect, SvgXml } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

const BIOMETRICS_GRID_XML =
  '<svg overflow="visible" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">\n<g id="Icon" clip-path="url(#clip_bio_grid)">\n<path id="Vector" d="M2.74988 7.75C2.74988 7.2786 2.74988 7.04289 2.89632 6.89645C3.04277 6.75 3.27847 6.75 3.74988 6.75H4.24988C4.72128 6.75 4.95698 6.75 5.10343 6.89645C5.24988 7.04289 5.24988 7.2786 5.24988 7.75V8.25C5.24988 8.7214 5.24988 8.95711 5.10343 9.10355C4.95698 9.25 4.72128 9.25 4.24988 9.25C3.54277 9.25 3.18922 9.25 2.96955 9.03033C2.74988 8.81066 2.74988 8.45711 2.74988 7.75Z" stroke="#B385E0" stroke-width="0.75"/>\n<path id="Vector_2" d="M2.74988 4.24997C2.74988 3.54286 2.74988 3.18931 2.96955 2.96964C3.18922 2.74997 3.54277 2.74997 4.24988 2.74997C4.72128 2.74997 4.95698 2.74997 5.10343 2.89642C5.24988 3.04286 5.24988 3.27856 5.24988 3.74997V4.24997C5.24988 4.72137 5.24988 4.95708 5.10343 5.10352C4.95698 5.24997 4.72128 5.24997 4.24988 5.24997H3.74988C3.27847 5.24997 3.04277 5.24997 2.89632 5.10352C2.74988 4.95708 2.74988 4.72137 2.74988 4.24997Z" stroke="#B385E0" stroke-width="0.75"/>\n<path id="Vector_3" d="M6.75 7.75C6.75 7.2786 6.75 7.04289 6.89645 6.89645C7.04289 6.75 7.2786 6.75 7.75 6.75H8.25C8.7214 6.75 8.95711 6.75 9.10355 6.89645C9.25 7.04289 9.25 7.2786 9.25 7.75C9.25 8.45711 9.25 8.81066 9.03033 9.03033C8.81066 9.25 8.45711 9.25 7.75 9.25C7.2786 9.25 7.04289 9.25 6.89645 9.10355C6.75 8.95711 6.75 8.7214 6.75 8.25V7.75Z" stroke="#B385E0" stroke-width="0.75"/>\n<path id="Vector_4" d="M6.75 3.74997C6.75 3.27856 6.75 3.04286 6.89645 2.89642C7.04289 2.74997 7.2786 2.74997 7.75 2.74997C8.45711 2.74997 8.81066 2.74997 9.03033 2.96964C9.25 3.18931 9.25 3.54286 9.25 4.24997C9.25 4.72137 9.25 4.95708 9.10355 5.10352C8.95711 5.24997 8.7214 5.24997 8.25 5.24997H7.75C7.2786 5.24997 7.04289 5.24997 6.89645 5.10352C6.75 4.95708 6.75 4.72137 6.75 4.24997V3.74997Z" stroke="#B385E0" stroke-width="0.75"/>\n<path id="Vector_5" opacity="0.5" d="M11.0001 7.00003C11.0001 8.88565 11.0001 9.82846 10.4143 10.4142C9.82855 11 8.88574 11 7.00012 11" stroke="#B385E0" stroke-width="0.75" stroke-linecap="round"/>\n<path id="Vector_6" opacity="0.5" d="M5.00012 11C3.1145 11 2.17169 11 1.58591 10.4142C1.00012 9.82846 1.00012 8.88565 1.00012 7.00003" stroke="#B385E0" stroke-width="0.75" stroke-linecap="round"/>\n<path id="Vector_7" opacity="0.5" d="M5.00012 1.00003C3.1145 1.00003 2.17169 1.00003 1.58591 1.58582C1.00012 2.1716 1.00012 3.11441 1.00012 5.00003" stroke="#B385E0" stroke-width="0.75" stroke-linecap="round"/>\n<path id="Vector_8" opacity="0.5" d="M7.00012 1.00003C8.88574 1.00003 9.82855 1.00003 10.4143 1.58582C11.0001 2.1716 11.0001 3.11441 11.0001 5.00003" stroke="#B385E0" stroke-width="0.75" stroke-linecap="round"/>\n</g>\n<defs>\n<clipPath id="clip_bio_grid">\n<rect width="12" height="12" rx="2.5" fill="white"/>\n</clipPath>\n</defs>\n</svg>';

/** 12px face-grid from Figma Biometria toggle card. */
export function BiometricsGridIcon({ size = 12, color = '#B385E0' }: IconProps) {
  const xml = useMemo(
    () => BIOMETRICS_GRID_XML.replace(/#B385E0/gi, color),
    [color],
  );

  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}

/** Face-grid / biometric glyph matching the Biometria settings design */
export function BiometricsFaceIcon({
  size = 20,
  color = '#CBCECA',
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Rect
        x={4}
        y={3.5}
        width={12}
        height={13}
        rx={3}
        stroke={color}
        strokeWidth={1.35}
      />
      <Path
        d="M7.2 8.2C7.2 7.5 7.7 7 8.4 7C9.1 7 9.6 7.5 9.6 8.2"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <Path
        d="M10.4 8.2C10.4 7.5 10.9 7 11.6 7C12.3 7 12.8 7.5 12.8 8.2"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <Path
        d="M7.5 12.2C8.2 13.1 9.1 13.6 10 13.6C10.9 13.6 11.8 13.1 12.5 12.2"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <Path
        d="M4 7H2.8"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <Path
        d="M4 10H2.8"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <Path
        d="M17.2 7H16"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <Path
        d="M17.2 10H16"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BiometricsFingerprintIcon({
  size = 20,
  color = '#CBCECA',
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M10 3.5C7.5 3.5 5.5 5.5 5.5 8V11.5"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      <Path
        d="M14.5 8C14.5 5.5 12.5 3.5 10 3.5"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      <Path
        d="M7 8.2C7 6.5 8.3 5.2 10 5.2C11.7 5.2 13 6.5 13 8.2V12"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      <Path
        d="M10 7C9.2 7 8.5 7.7 8.5 8.5V14.2"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      <Path
        d="M11.5 8.8V13.5"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      <Path
        d="M6.2 12.5C6.8 14.8 8.3 16.2 10 16.2C11.4 16.2 12.6 15.3 13.3 13.8"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      <Circle cx={10} cy={9.2} r={0.7} fill={color} />
    </Svg>
  );
}
