import { useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import {
  SETTINGS_BANK_XML,
  SETTINGS_BIOMETRICS_XML,
  SETTINGS_CARD_XML,
  SETTINGS_CHEVRON_XML,
  SETTINGS_CROWN_XML,
  SETTINGS_EDIT_XML,
  SETTINGS_KEY_XML,
  SETTINGS_LOGOUT_XML,
  SETTINGS_PASSWORD_XML,
  SETTINGS_PROFILE_XML,
  SETTINGS_REPORT_XML,
  SETTINGS_ROCKET_XML,
  SETTINGS_SLIDERS_XML,
  SETTINGS_SPARKLE_XML,
  SETTINGS_STAR_XML,
  SETTINGS_SUPPORT_XML,
} from '@/presentation/components/ui/settings-icon-xml';

type IconProps = {
  size?: number;
  color?: string;
};

function tintFigmaIcon(xml: string, color: string) {
  return xml.replace(/#E0E2DF|#FFD700|#B366FF|#9941F1|#212022|#C33A22/gi, color);
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

export function SettingsChevronIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={SETTINGS_CHEVRON_XML} size={size} color={color} />;
}

export function SettingsEditIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={SETTINGS_EDIT_XML} size={size} color={color} />;
}

export function SettingsRocketIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={SETTINGS_ROCKET_XML} size={size} color={color} />;
}

export function SettingsSparkleIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={SETTINGS_SPARKLE_XML} size={size} color={color} />;
}

export function SettingsBankIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={SETTINGS_BANK_XML} size={size} color={color} />;
}

export function SettingsStarIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={SETTINGS_STAR_XML} size={size} color={color} />;
}

export function SettingsProfileIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={SETTINGS_PROFILE_XML} size={size} color={color} />;
}

export function SettingsSlidersIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={SETTINGS_SLIDERS_XML} size={size} color={color} />;
}

export function SettingsCardIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={SETTINGS_CARD_XML} size={size} color={color} />;
}

export function SettingsKeyIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={SETTINGS_KEY_XML} size={size} color={color} />;
}

export function SettingsPasswordIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={SETTINGS_PASSWORD_XML} size={size} color={color} />;
}

export function SettingsBiometricsIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={SETTINGS_BIOMETRICS_XML} size={size} color={color} />;
}

export function SettingsReportIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={SETTINGS_REPORT_XML} size={size} color={color} />;
}

export function SettingsSupportIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={SETTINGS_SUPPORT_XML} size={size} color={color} />;
}

export function SettingsLogoutIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={SETTINGS_LOGOUT_XML} size={size} color={color} />;
}

export function SettingsCrownIcon({ size = 20, color }: IconProps) {
  return <FigmaIcon xml={SETTINGS_CROWN_XML} size={size} color={color} />;
}
