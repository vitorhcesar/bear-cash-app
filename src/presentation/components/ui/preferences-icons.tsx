import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, SvgXml } from 'react-native-svg';

import {
  PREF_RESTORE_XML,
  PREF_SOUND_XML,
  PREF_VIBRATION_XML,
} from '@/presentation/components/ui/preferences-icon-xml';
import { BearCashColors } from '@/presentation/constants/theme';

type IconProps = {
  size?: number;
  color?: string;
};

const TOGGLE_ON = '#A65BF0';

function tintFigmaIcon(xml: string, color: string) {
  return xml.replace(/#E0DFE2|#59565D|#9941F1/gi, color);
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

export function SoundNoteIcon({ size = 12, color }: IconProps) {
  return <FigmaIcon xml={PREF_SOUND_XML} size={size} color={color} />;
}

export function VibrationPhoneIcon({ size = 12, color }: IconProps) {
  return <FigmaIcon xml={PREF_VIBRATION_XML} size={size} color={color} />;
}

export function PreferenceRestoreIcon({ size = 12, color }: IconProps) {
  return <FigmaIcon xml={PREF_RESTORE_XML} size={size} color={color} />;
}

export function BellIcon({ size = 12, color = '#E0DFE2' }: IconProps) {
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

/** 12px sun for the extra Modo Claro row (not in the Figma frame). */
export function SunIcon({ size = 12, color = '#E0DFE2' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Circle cx={6} cy={6} r={2.15} stroke={color} />
      <Path d="M6 1.25V2.15" stroke={color} strokeLinecap="round" />
      <Path d="M6 9.85V10.75" stroke={color} strokeLinecap="round" />
      <Path d="M1.25 6H2.15" stroke={color} strokeLinecap="round" />
      <Path d="M9.85 6H10.75" stroke={color} strokeLinecap="round" />
      <Path d="M2.64 2.64L3.28 3.28" stroke={color} strokeLinecap="round" />
      <Path d="M8.72 8.72L9.36 9.36" stroke={color} strokeLinecap="round" />
      <Path d="M9.36 2.64L8.72 3.28" stroke={color} strokeLinecap="round" />
      <Path d="M3.28 8.72L2.64 9.36" stroke={color} strokeLinecap="round" />
    </Svg>
  );
}

type PreferenceToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
};

/** Compact 32×20 toggle from Figma Preferências. */
export function PreferenceToggle({ value, onValueChange }: PreferenceToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={[styles.track, value ? styles.trackOn : styles.trackOff]}
    >
      <View style={[styles.thumb, value ? styles.thumbOn : styles.thumbOff]}>
        <View style={[styles.dot, value ? styles.dotOn : styles.dotOff]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 32,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  trackOff: {
    backgroundColor: BearCashColors.borderStrong,
  },
  trackOn: {
    backgroundColor: TOGGLE_ON,
  },
  thumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbOff: {
    alignSelf: 'flex-start',
    backgroundColor: BearCashColors.neutralBase,
  },
  thumbOn: {
    alignSelf: 'flex-end',
    backgroundColor: BearCashColors.neutralLight,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotOff: {
    backgroundColor: BearCashColors.bannerMuted,
  },
  dotOn: {
    backgroundColor: TOGGLE_ON,
  },
});
