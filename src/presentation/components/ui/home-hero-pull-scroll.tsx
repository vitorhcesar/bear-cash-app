import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import {
  HARD_PULL_HOLD,
  HARD_PULL_THRESHOLD,
  pullSpinnerOpacity,
  rubberbandPull,
} from "@/presentation/constants/pull-refresh";
import { BearCashColors } from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";
import { useBearCashTheme } from "@/presentation/theme/bear-cash-theme-context";

const REFRESH_HOLD = HARD_PULL_HOLD;
const PULL_THRESHOLD = HARD_PULL_THRESHOLD;
const HEADER_TOP_OFFSET = 16;
const HEADER_AVATAR_SIZE = 56;
const HEADER_SCRIM_TAIL = 36;
const HEADER_SCRIM_FADE_START = 104;
const HEADER_SCRIM_FADE_END = 192;

function rubberband(distance: number) {
  "worklet";
  return rubberbandPull(distance);
}

function HomeHeaderScrollScrim({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const { scheme } = useBearCashTheme();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const fill = BearCashColors.background;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return (
    <Svg
      key={`${scheme}:${fill}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
    >
      <Defs>
        <LinearGradient
          id={`headerScrim${uid}${scheme}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <Stop offset="0" stopColor={fill} stopOpacity={1} />
          <Stop offset="0.52" stopColor={fill} stopOpacity={1} />
          <Stop offset="1" stopColor={fill} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={`url(#headerScrim${uid}${scheme})`}
      />
    </Svg>
  );
}

export type HomeHeroPullScrollHandle = {
  scrollToTop: () => void;
};

type HomeHeroPullScrollProps = {
  heroHeight: number;
  refreshing: boolean;
  onRefresh: () => void;
  hero: ReactNode;
  header: ReactNode;
  children: ReactNode;
};

export const HomeHeroPullScroll = forwardRef<
  HomeHeroPullScrollHandle,
  HomeHeroPullScrollProps
>(function HomeHeroPullScroll(
  { heroHeight, refreshing, onRefresh, hero, header, children },
  ref,
) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  useImperativeHandle(
    ref,
    () => ({
      scrollToTop() {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      },
    }),
    [],
  );

  const scrollY = useSharedValue(0);
  const androidPull = useSharedValue(0);
  const refreshingSv = useSharedValue(refreshing);
  const triggered = useSharedValue(false);
  const headerScrimHeight =
    insets.top + HEADER_TOP_OFFSET + HEADER_AVATAR_SIZE + HEADER_SCRIM_TAIL;

  useEffect(() => {
    refreshingSv.value = refreshing;
    if (refreshing) {
      if (Platform.OS === "android") {
        androidPull.value = withTiming(REFRESH_HOLD, { duration: 180 });
      } else {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ y: -REFRESH_HOLD, animated: true });
        });
      }
      return;
    }
    triggered.value = false;
    androidPull.value = withTiming(0, { duration: 220 });
  }, [androidPull, refreshing, refreshingSv, triggered]);

  function armRefresh() {
    if (triggered.value || refreshingSv.value) {
      return;
    }
    triggered.value = true;
    onRefresh();
  }

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  function handleEndDrag(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (Platform.OS !== "ios" || refreshing || triggered.value) {
      return;
    }
    if (-event.nativeEvent.contentOffset.y >= PULL_THRESHOLD) {
      armRefresh();
    }
  }

  const nativeScroll = Gesture.Native();
  const pan = Gesture.Pan()
    .enabled(Platform.OS === "android")
    .activeOffsetY(10)
    .failOffsetX([-18, 18])
    .simultaneousWithExternalGesture(nativeScroll)
    .onTouchesMove((_event, state) => {
      if (scrollY.value > 2) {
        state.fail();
      }
    })
    .onUpdate((event) => {
      if (refreshingSv.value || scrollY.value > 2 || event.translationY <= 0) {
        return;
      }
      androidPull.value = rubberband(event.translationY);
    })
    .onEnd(() => {
      if (refreshingSv.value) {
        return;
      }
      if (androidPull.value >= PULL_THRESHOLD) {
        androidPull.value = withTiming(REFRESH_HOLD, { duration: 160 });
        runOnJS(armRefresh)();
        return;
      }
      androidPull.value = withTiming(0, { duration: 200 });
    });

  const headerScrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      Math.max(scrollY.value, 0),
      [0, HEADER_SCRIM_FADE_START, HEADER_SCRIM_FADE_END],
      [0, 0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const androidContentStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: Platform.OS === "android" ? androidPull.value : 0 },
    ],
  }));

  const spinnerStyle = useAnimatedStyle(() => {
    const isRefreshing = refreshingSv.value;
    const pull =
      Platform.OS === "ios"
        ? Math.max(-scrollY.value, isRefreshing ? REFRESH_HOLD : 0)
        : androidPull.value;
    const progress = isRefreshing ? 1 : pullSpinnerOpacity(pull, false);
    return {
      opacity: progress,
      transform: [
        {
          translateY: isRefreshing
            ? 0
            : interpolate(
                pull,
                [0, PULL_THRESHOLD],
                [-18, 0],
                Extrapolation.CLAMP,
              ),
        },
        {
          scale: isRefreshing
            ? 1
            : interpolate(
                pull,
                [0, PULL_THRESHOLD],
                [0.88, 1],
                Extrapolation.CLAMP,
              ),
        },
      ],
    };
  });

  function handleMomentumEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (Platform.OS !== "ios" || refreshing || triggered.value) {
      return;
    }
    if (-event.nativeEvent.contentOffset.y >= PULL_THRESHOLD) {
      armRefresh();
    }
  }

  return (
    <View style={styles.root}>
      <View
        pointerEvents="none"
        collapsable={false}
        style={[styles.heroLayer, { height: heroHeight }]}
      >
        {hero}
      </View>

      <GestureDetector gesture={Gesture.Simultaneous(pan, nativeScroll)}>
        <Animated.ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          contentInset={
            Platform.OS === "ios" && refreshing
              ? { top: REFRESH_HOLD }
              : undefined
          }
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical
          bounces
          overScrollMode="never"
          scrollEventThrottle={16}
          onScroll={onScroll}
          onScrollEndDrag={handleEndDrag}
          onMomentumScrollEnd={handleMomentumEnd}
        >
          <Animated.View style={androidContentStyle}>{children}</Animated.View>
        </Animated.ScrollView>
      </GestureDetector>

      <Animated.View pointerEvents="box-none" style={styles.headerLayer}>
        <Animated.View
          pointerEvents="none"
          collapsable={false}
          style={[
            styles.headerScrim,
            { height: headerScrimHeight },
            headerScrimStyle,
          ]}
        >
          <HomeHeaderScrollScrim
            width={windowWidth}
            height={headerScrimHeight}
          />
        </Animated.View>
        {header}
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[styles.spinner, { top: insets.top + 10 }, spinnerStyle]}
      >
        <View style={styles.spinnerBadge}>
          <ActivityIndicator size="large" color={BearCashColors.buttonFilled} />
        </View>
      </Animated.View>
    </View>
  );
});

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    heroLayer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 0,
      overflow: "hidden",
      backgroundColor: BearCashColors.background,
    },
    headerLayer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 3,
    },
    headerScrim: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 0,
    },
    scroll: {
      flex: 1,
      zIndex: 1,
      backgroundColor: "transparent",
    },
    scrollContent: {
      flexGrow: 1,
    },
    spinner: {
      position: "absolute",
      left: 0,
      right: 0,
      zIndex: 4,
      alignItems: "center",
    },
    spinnerBadge: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(10, 10, 11, 0.9)",
      borderWidth: 1,
      borderColor: BearCashColors.borderStrong,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 10,
      elevation: 8,
    },
  }),
);
