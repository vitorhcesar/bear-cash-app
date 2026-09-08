import { useId, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { SettingsCrownIcon } from '@/presentation/components/ui/settings-icons';
import { OttoColors, OttoFonts } from '@/presentation/constants/theme';

const GOLD = OttoColors.premiumGold;
const GOLD_MUTED = OttoColors.premiumGoldMuted;

type OttoPremiumBannerProps = {
  onPress?: () => void;
};

export function OttoPremiumBanner({ onPress }: OttoPremiumBannerProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [size, setSize] = useState({ width: 0, height: 0 });

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) {
      setSize({ width, height });
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Otto Premium. Desbloqueie todos os recursos. Conheça."
      onPress={onPress}
      style={({ pressed }) => [styles.shadow, pressed && styles.pressed]}
    >
      <View onLayout={onLayout} style={styles.banner}>
        {size.width > 0 ? (
          <Svg
            pointerEvents="none"
            width={size.width}
            height={size.height}
            style={StyleSheet.absoluteFill}
          >
            <Defs>
              <LinearGradient id={`base${uid}`} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#121311" />
                <Stop offset="0.5" stopColor="#1A1D1A" />
                <Stop offset="1" stopColor="#0A0B0A" />
              </LinearGradient>
              <LinearGradient id={`gold${uid}`} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={GOLD} stopOpacity={0.24} />
                <Stop offset="1" stopColor={GOLD_MUTED} stopOpacity={0.12} />
              </LinearGradient>
            </Defs>
            <Rect
              width={size.width}
              height={size.height}
              rx={12}
              fill={`url(#base${uid})`}
            />
            <Rect
              width={size.width}
              height={size.height}
              rx={12}
              fill={`url(#gold${uid})`}
            />
          </Svg>
        ) : null}

        <View style={styles.left}>
          <View style={styles.iconBadge}>
            <SettingsCrownIcon size={20} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>Otto Premium</Text>
            <Text style={styles.subtitle}>Desbloqueie todos os recursos</Text>
          </View>
        </View>

        <View style={styles.cta}>
          <Text style={styles.ctaLabel}>Conheça →</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    alignSelf: 'stretch',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  banner: {
    height: 112,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    backgroundColor: '#121311',
    padding: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontFamily: OttoFonts.semiBold,
    fontSize: 18,
    lineHeight: 22,
    color: GOLD,
  },
  subtitle: {
    fontFamily: OttoFonts.regular,
    fontSize: 13,
    lineHeight: 17,
    color: GOLD_MUTED,
  },
  cta: {
    flexShrink: 0,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ctaLabel: {
    fontFamily: OttoFonts.semiBold,
    fontSize: 12,
    lineHeight: 16,
    color: GOLD,
  },
  pressed: {
    opacity: 0.85,
  },
});
