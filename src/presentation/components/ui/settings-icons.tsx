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
import { FigmaSvgIcon } from '@/presentation/components/ui/figma-svg-icon';

type IconProps = {
  size?: number;
  color?: string;
};

export function SettingsChevronIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={SETTINGS_CHEVRON_XML} size={size} color={color} />;
}

export function SettingsEditIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={SETTINGS_EDIT_XML} size={size} color={color} />;
}

export function SettingsRocketIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={SETTINGS_ROCKET_XML} size={size} color={color} />;
}

export function SettingsSparkleIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={SETTINGS_SPARKLE_XML} size={size} color={color} />;
}

export function SettingsBankIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={SETTINGS_BANK_XML} size={size} color={color} />;
}

export function SettingsStarIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={SETTINGS_STAR_XML} size={size} color={color} />;
}

export function SettingsProfileIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={SETTINGS_PROFILE_XML} size={size} color={color} />;
}

export function SettingsSlidersIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={SETTINGS_SLIDERS_XML} size={size} color={color} />;
}

export function SettingsCardIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={SETTINGS_CARD_XML} size={size} color={color} />;
}

export function SettingsKeyIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={SETTINGS_KEY_XML} size={size} color={color} />;
}

export function SettingsPasswordIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={SETTINGS_PASSWORD_XML} size={size} color={color} />;
}

export function SettingsBiometricsIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={SETTINGS_BIOMETRICS_XML} size={size} color={color} />;
}

export function SettingsReportIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={SETTINGS_REPORT_XML} size={size} color={color} />;
}

export function SettingsSupportIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={SETTINGS_SUPPORT_XML} size={size} color={color} />;
}

export function SettingsLogoutIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={SETTINGS_LOGOUT_XML} size={size} color={color} />;
}

export function SettingsCrownIcon({ size = 20, color }: IconProps) {
  return <FigmaSvgIcon xml={SETTINGS_CROWN_XML} size={size} color={color} />;
}
