import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  LinearTransition,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon } from '@/presentation/components/ui/auth-icons';
import { BearCashColors, BearCashTypography } from '@/presentation/constants/theme';

const SHEET_RADIUS = 24;
const ANIM_MS = 280;
const OPEN_EASING = Easing.out(Easing.cubic);
const CLOSE_EASING = Easing.in(Easing.cubic);

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /** Replaces the default title/subtitle header block */
  header?: ReactNode;
  showCloseButton?: boolean;
  closeIconColor?: string;
  /** Close sheet when tapping the backdrop — defaults to true */
  closeOnBackdropPress?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Fires when the sheet begins opening */
  onOpen?: () => void;
  /** Animate height/layout when the sheet content size changes */
  animateLayout?: boolean;
};

/** Animated bottom sheet used across authenticated flows. */
export function Sheet({
  visible,
  onClose,
  children,
  title,
  subtitle,
  header,
  showCloseButton = true,
  closeIconColor = BearCashColors.text,
  closeOnBackdropPress = true,
  contentStyle,
  onOpen,
  animateLayout = false,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(false);
  const [layoutLive, setLayoutLive] = useState(false);
  const onOpenRef = useRef(onOpen);
  const didShowRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    if (visible) {
      const alreadyMounted = mountedRef.current;
      didShowRef.current = true;
      onOpenRef.current?.();
      runOnUI(() => {
        'worklet';
        progress.value = 0;
        if (alreadyMounted) {
          progress.value = withTiming(1, {
            duration: ANIM_MS,
            easing: OPEN_EASING,
          });
        }
      })();
      mountedRef.current = true;
      setMounted(true);
      return;
    }

    if (!didShowRef.current) {
      return;
    }

    didShowRef.current = false;
    setLayoutLive(false);
    runOnUI(() => {
      'worklet';
      progress.value = withTiming(0, {
        duration: ANIM_MS,
        easing: CLOSE_EASING,
      });
    })();
    const timeout = setTimeout(() => {
      mountedRef.current = false;
      setMounted(false);
    }, ANIM_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `progress` is a stable SharedValue
  }, [visible]);

  useEffect(() => {
    if (!mounted || !animateLayout) {
      setLayoutLive(false);
      return;
    }

    const frame = requestAnimationFrame(() => setLayoutLive(true));
    return () => cancelAnimationFrame(frame);
  }, [mounted, animateLayout]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.55,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * windowHeight }],
  }));

  if (!mounted) {
    return null;
  }

  const hasDefaultHeader = Boolean(title || subtitle);
  const showHeader = Boolean(header || hasDefaultHeader || showCloseButton);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onShow={() => {
        runOnUI(() => {
          'worklet';
          progress.value = withTiming(1, {
            duration: ANIM_MS,
            easing: OPEN_EASING,
          });
        })();
      }}
      onRequestClose={onClose}
    >
      <View style={styles.root} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          style={StyleSheet.absoluteFill}
          onPress={closeOnBackdropPress ? onClose : undefined}
          disabled={!closeOnBackdropPress}
        >
          <Animated.View style={[styles.backdrop, backdropStyle]} />
        </Pressable>

        <Animated.View style={[styles.sheetSlide, sheetStyle]}>
          <Animated.View
            layout={
              layoutLive
                ? LinearTransition.duration(ANIM_MS).easing(OPEN_EASING)
                : undefined
            }
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 16) + 8 },
              contentStyle,
              animateLayout ? styles.layoutClip : null,
            ]}
          >
            {showHeader ? (
              <View style={styles.header}>
                {header ? (
                  <View style={styles.headerMain}>{header}</View>
                ) : hasDefaultHeader ? (
                  <View style={styles.headerMain}>
                    {title ? <Text style={styles.title}>{title}</Text> : null}
                    {subtitle ? (
                      <Text style={styles.subtitle}>{subtitle}</Text>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.headerMain} />
                )}

                {showCloseButton ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Fechar"
                    hitSlop={12}
                    style={styles.closeButton}
                    onPress={onClose}
                  >
                    <CloseIcon size={20} color={closeIconColor} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {children}
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
  sheetSlide: {
    backgroundColor: BearCashColors.background,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    overflow: 'hidden',
  },
  sheet: {
    backgroundColor: BearCashColors.background,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 24,
  },
  layoutClip: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerMain: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...BearCashTypography.h3,
    color: BearCashColors.text,
  },
  subtitle: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
});
