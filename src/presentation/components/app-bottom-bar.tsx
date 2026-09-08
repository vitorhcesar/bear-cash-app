import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AiAskGlyph,
  HomeTabGlyph,
  OttoMarkGlyph,
  WalletTabGlyph,
} from "@/presentation/components/ui/figma-tab-icons";
import { GlassSurface } from "@/presentation/components/ui/glass-surface";
import { springPill } from "@/presentation/components/ui/pill-motion";
import { OttoColors, OttoTypography } from "@/presentation/constants/theme";

export type AppTabKey = "home" | "activities" | "community";

type AppBottomBarProps = {
  activeTab: AppTabKey;
  onTabPress: (tab: AppTabKey) => void;
  onAskAiPress?: () => void;
  onSettingsPress?: () => void;
  communityBadgeCount?: number;
};

const INACTIVE_ICON = OttoColors.textMid;
const ACTIVE_ICON = OttoColors.text;
const PILL_PAD = 4;
const PILL_RADIUS = 24;
const TAB_INDEX: Record<AppTabKey, number> = {
  home: 0,
  activities: 1,
  community: 2,
};

export function AppBottomBar({
  activeTab,
  onTabPress,
  onAskAiPress,
  onSettingsPress,
  communityBadgeCount = 2,
}: AppBottomBarProps) {
  const insets = useSafeAreaInsets();
  const slotWidth = useRef(0);
  const measured = useRef(false);
  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillW.value,
  }));

  function snapPill(tab: AppTabKey, width: number) {
    const nextX = PILL_PAD + TAB_INDEX[tab] * width;
    runOnUI((x: number, w: number) => {
      "worklet";
      pillX.value = x;
      pillW.value = w;
    })(nextX, width);
  }

  function animatePill(tab: AppTabKey, width: number) {
    if (width <= 0) {
      return;
    }
    const nextX = PILL_PAD + TAB_INDEX[tab] * width;
    runOnUI((x: number, w: number) => {
      "worklet";
      pillX.value = springPill(x);
      pillW.value = springPill(w);
    })(nextX, width);
  }

  useEffect(() => {
    if (!measured.current) {
      return;
    }
    animatePill(activeTab, slotWidth.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- slot width lives in a ref
  }, [activeTab]);

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Pergunte ao Otto IA"
        onPress={onAskAiPress}
      >
        <GlassSurface
          padded={false}
          style={styles.aiBar}
          contentStyle={styles.aiBarContent}
        >
          <Text style={styles.aiPlaceholder}>Pergunte ao Otto IA</Text>
          <View style={styles.aiIconWrap}>
            <AiAskGlyph size={24} color={OttoColors.primarySoft} />
          </View>
        </GlassSurface>
      </Pressable>

      <View style={styles.navRow}>
        <GlassSurface
          padded={false}
          style={styles.navPill}
          contentStyle={styles.navPillContent}
        >
          <View
            style={styles.navTrack}
            onLayout={(event) => {
              const inner = Math.max(
                0,
                event.nativeEvent.layout.width - PILL_PAD * 2,
              );
              const width = inner / 3;
              const widthChanged = Math.abs(width - slotWidth.current) > 0.5;
              slotWidth.current = width;

              if (!measured.current) {
                measured.current = true;
                snapPill(activeTab, width);
                return;
              }

              if (widthChanged) {
                snapPill(activeTab, width);
              }
            }}
          >
            <Animated.View
              pointerEvents="none"
              style={[styles.routePill, pillStyle]}
            >
              <GlassSurface
                padded={false}
                radius={PILL_RADIUS}
                glassEffectStyle="regular"
                tintColor="rgba(149, 255, 82, 0.06)"
                bottomGlow
                style={styles.routePillGlass}
              />
            </Animated.View>

            <Pressable
              accessibilityRole="tab"
              accessibilityLabel="Home"
              accessibilityState={{ selected: activeTab === "home" }}
              hitSlop={10}
              onPress={() => onTabPress("home")}
              style={[
                styles.navSlot,
                activeTab !== "home" && styles.navSlotIdle,
              ]}
            >
              <HomeTabGlyph
                size={24}
                color={activeTab === "home" ? ACTIVE_ICON : INACTIVE_ICON}
              />
            </Pressable>

            <Pressable
              accessibilityRole="tab"
              accessibilityLabel="Atividades"
              accessibilityState={{ selected: activeTab === "activities" }}
              hitSlop={10}
              onPress={() => onTabPress("activities")}
              style={[
                styles.navSlot,
                activeTab !== "activities" && styles.navSlotIdle,
              ]}
            >
              <WalletTabGlyph
                size={24}
                color={
                  activeTab === "activities" ? ACTIVE_ICON : INACTIVE_ICON
                }
              />
            </Pressable>

            <Pressable
              accessibilityRole="tab"
              accessibilityLabel="Comunidade"
              accessibilityState={{ selected: activeTab === "community" }}
              hitSlop={10}
              onPress={() => onTabPress("community")}
              style={[
                styles.navSlot,
                activeTab !== "community" && styles.navSlotIdle,
              ]}
            >
              <View style={styles.avatarStack}>
                <View style={[styles.miniAvatar, styles.avatarTopLeft]}>
                  <Image
                    source={require("@/assets/images/avatars/onca.png")}
                    style={styles.miniAvatarImage}
                    contentFit="cover"
                  />
                </View>
                <View style={[styles.miniAvatar, styles.avatarTopRight]}>
                  <Image
                    source={require("@/assets/images/avatars/lhama.png")}
                    style={styles.miniAvatarImage}
                    contentFit="cover"
                  />
                </View>
                <View style={[styles.miniAvatar, styles.avatarBottom]}>
                  <Image
                    source={require("@/assets/images/avatars/akita.png")}
                    style={styles.miniAvatarImage}
                    contentFit="cover"
                  />
                </View>
                {communityBadgeCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{communityBadgeCount}</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          </View>
        </GlassSurface>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Perfil e configurações"
          onPress={onSettingsPress}
        >
          <GlassSurface
            padded={false}
            style={styles.logoButton}
            contentStyle={styles.logoButtonContent}
          >
            <OttoMarkGlyph />
          </GlassSurface>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    width: "100%",
    minWidth: 280,
    maxWidth: 340,
    alignSelf: "center",
  },
  aiBar: {
    height: 48,
    width: "100%",
  },
  aiBarContent: {
    height: 48,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  aiPlaceholder: {
    ...OttoTypography.bodySmall,
    lineHeight: 22.4,
    color: OttoColors.textMid,
    zIndex: 1,
  },
  aiIconWrap: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 1,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  navPill: {
    flex: 1,
    height: 56,
  },
  navPillContent: {
    flex: 1,
    height: 56,
  },
  navTrack: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    position: "relative",
    padding: PILL_PAD,
  },
  routePill: {
    position: "absolute",
    top: PILL_PAD,
    bottom: PILL_PAD,
    left: 0,
    zIndex: 0,
    overflow: "hidden",
    borderRadius: PILL_RADIUS,
  },
  routePillGlass: {
    flex: 1,
  },
  navSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  navSlotIdle: {
    opacity: 0.82,
  },
  avatarStack: {
    width: 34,
    height: 32,
    position: "relative",
  },
  miniAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 0.25,
    borderColor: OttoColors.borderSoft,
    position: "absolute",
    backgroundColor: OttoColors.surface,
  },
  miniAvatarImage: {
    width: 45,
    height: 67,
    position: "absolute",
    left: -7,
    top: -15,
  },
  avatarTopLeft: {
    left: 0,
    top: 0,
    zIndex: 3,
  },
  avatarTopRight: {
    left: 12,
    top: 0,
    zIndex: 2,
  },
  avatarBottom: {
    left: 7,
    top: 12,
    zIndex: 1,
  },
  badge: {
    position: "absolute",
    left: 25,
    top: 14,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: OttoColors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    zIndex: 4,
  },
  badgeText: {
    ...OttoTypography.captionSmall,
    color: OttoColors.text,
    textAlign: "center",
    width: 12,
  },
  logoButton: {
    width: 56,
    height: 56,
  },
  logoButtonContent: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
});
