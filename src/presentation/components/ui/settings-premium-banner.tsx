import { Image } from "expo-image";
import { useId, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop, SvgXml } from "react-native-svg";

import { SETTINGS_PREMIUM_WORDMARK_XML } from "@/presentation/components/ui/settings-premium-wordmark-xml";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";

const PAW = require("@/assets/images/settings/premium-paw.png");

const WORDMARK_WIDTH = 87;
const WORDMARK_HEIGHT = 20.744;
const PAW_WIDTH = 98.75;
const PAW_HEIGHT = 131.667;

type SettingsPremiumBannerProps = {
  onPress?: () => void;
};

export function SettingsPremiumBanner({ onPress }: SettingsPremiumBannerProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
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
      accessibilityLabel="Premium. Assine e acompanhe todos os seus gastos em um só lugar."
      onPress={onPress}
      onLayout={onLayout}
      style={({ pressed }) => [styles.banner, pressed && styles.pressed]}
    >
      {size.width > 0 ? (
        <Svg
          pointerEvents="none"
          width={size.width}
          height={size.height}
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <LinearGradient
              id={`base${uid}`}
              x1="0.32"
              y1="0.72"
              x2="1.18"
              y2="0.18"
            >
              <Stop offset="0" stopColor="#121113" />
              <Stop offset="1" stopColor="#5500A9" />
            </LinearGradient>
            <LinearGradient
              id={`wash${uid}`}
              x1="0.03"
              y1="0.5"
              x2="0.84"
              y2="0.42"
            >
              <Stop offset="0" stopColor="#121113" stopOpacity={0} />
              <Stop offset="1" stopColor="#6A0084" stopOpacity={0.35} />
            </LinearGradient>
          </Defs>
          <Rect
            width={size.width}
            height={size.height}
            rx={16}
            fill={`url(#base${uid})`}
          />
          <Rect
            width={size.width}
            height={size.height}
            rx={16}
            fill={`url(#wash${uid})`}
          />
        </Svg>
      ) : null}

      <Image
        source={PAW}
        contentFit="cover"
        style={styles.paw}
        pointerEvents="none"
      />

      <View style={styles.copy}>
        <View
          accessibilityRole="image"
          accessibilityLabel="Premium"
          style={styles.wordmark}
        >
          <SvgXml
            xml={SETTINGS_PREMIUM_WORDMARK_XML}
            width={WORDMARK_WIDTH}
            height={WORDMARK_HEIGHT}
          />
        </View>
        <Text style={styles.subtitle}>
          Assine e <Text style={styles.subtitleStrong}>acompanhe</Text> todos
          os seus gastos{" "}
          <Text style={styles.subtitleStrong}>em um só lugar.</Text>
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignSelf: "stretch",
    height: 101,
    borderRadius: 16,
    backgroundColor: "#121113",
    overflow: "hidden",
    justifyContent: "center",
  },
  paw: {
    position: "absolute",
    right: 0,
    top: -1,
    width: PAW_WIDTH,
    height: PAW_HEIGHT,
  },
  copy: {
    width: 185,
    marginLeft: 18,
    gap: 6,
    zIndex: 1,
  },
  wordmark: {
    width: WORDMARK_WIDTH,
    height: WORDMARK_HEIGHT,
    overflow: "hidden",
  },
  subtitle: {
    ...BearCashTypography.caption,
    color: BearCashColors.text,
  },
  subtitleStrong: {
    fontFamily: BearCashFonts.semiBold,
  },
  pressed: {
    opacity: 0.92,
  },
});
