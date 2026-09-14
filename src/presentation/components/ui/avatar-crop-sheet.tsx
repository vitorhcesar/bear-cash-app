import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RefreshIcon } from '@/presentation/components/ui/auth-icons';
import { BearCashColors, BearCashTypography } from '@/presentation/constants/theme';

const CORNER_ARM = 28;
const CORNER_STROKE = 2.5;
const MAX_PINCH = 4;

export type ProfilePhotoCrop = {
  rotationDegrees: number;
  originX: number;
  originY: number;
  width: number;
  height: number;
};

export type AvatarCropSheetProps = {
  visible: boolean;
  uri: string | null;
  imageWidth?: number;
  imageHeight?: number;
  confirming?: boolean;
  onCancel: () => void;
  onConfirm: (crop: ProfilePhotoCrop) => void;
};

function aabbSize(imageWidth: number, imageHeight: number, rotation: number, scale: number) {
  'worklet';
  const rotated = rotation % 180 !== 0;
  const width = (rotated ? imageHeight : imageWidth) * scale;
  const height = (rotated ? imageWidth : imageHeight) * scale;
  return { width, height };
}

function minScaleToCover(imageWidth: number, imageHeight: number, rotation: number, cropSize: number) {
  'worklet';
  const { width, height } = aabbSize(imageWidth, imageHeight, rotation, 1);
  return Math.max(cropSize / width, cropSize / height);
}

function clampTranslation(tx: number, ty: number, aabbW: number, aabbH: number, cropSize: number) {
  'worklet';
  const maxX = Math.max(0, (aabbW - cropSize) / 2);
  const maxY = Math.max(0, (aabbH - cropSize) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, tx)),
    y: Math.min(maxY, Math.max(-maxY, ty)),
  };
}

export function AvatarCropSheet({
  visible,
  uri,
  imageWidth,
  imageHeight,
  confirming = false,
  onCancel,
  onConfirm,
}: AvatarCropSheetProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const cropSize = Math.min(windowWidth - 64, 280);

  const [rotation, setRotation] = useState(0);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [loadedSize, setLoadedSize] = useState({ width: 0, height: 0 });

  const naturalWidth = imageWidth && imageWidth > 0 ? imageWidth : loadedSize.width;
  const naturalHeight = imageHeight && imageHeight > 0 ? imageHeight : loadedSize.height;
  const hasSize = naturalWidth > 0 && naturalHeight > 0 && stage.width > 0 && stage.height > 0;

  const coverScale = useMemo(() => {
    if (!hasSize) {
      return 1;
    }
    const rotated = rotation % 180 !== 0;
    const aabbW = rotated ? naturalHeight : naturalWidth;
    const aabbH = rotated ? naturalWidth : naturalHeight;
    return Math.max(stage.width / aabbW, stage.height / aabbH, cropSize / aabbW, cropSize / aabbH);
  }, [cropSize, hasSize, naturalHeight, naturalWidth, rotation, stage.height, stage.width]);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const pinchScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startPinch = useSharedValue(1);

  const resetTransform = useCallback(() => {
    translateX.value = 0;
    translateY.value = 0;
    pinchScale.value = 1;
  }, [pinchScale, translateX, translateY]);

  const handleOpen = useCallback(() => {
    setRotation(0);
    setLoadedSize({ width: 0, height: 0 });
    resetTransform();
  }, [resetTransform]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setRotation(0);
    resetTransform();
  }, [resetTransform, uri, visible]);

  function handleRotate() {
    setRotation((current) => (current + 90) % 360);
    resetTransform();
  }

  function handleStageLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setStage((current) =>
      current.width === width && current.height === height ? current : { width, height },
    );
  }

  const composed = useMemo(() => {
    const pan = Gesture.Pan()
      .onBegin(() => {
        startX.value = translateX.value;
        startY.value = translateY.value;
      })
      .onChange((event) => {
        const scale = coverScale * pinchScale.value;
        const aabb = aabbSize(naturalWidth, naturalHeight, rotation, scale);
        const next = clampTranslation(
          startX.value + event.translationX,
          startY.value + event.translationY,
          aabb.width,
          aabb.height,
          cropSize,
        );
        translateX.value = next.x;
        translateY.value = next.y;
      });

    const pinch = Gesture.Pinch()
      .onBegin(() => {
        startPinch.value = pinchScale.value;
        startX.value = translateX.value;
        startY.value = translateY.value;
      })
      .onChange((event) => {
        const minScale = minScaleToCover(naturalWidth, naturalHeight, rotation, cropSize);
        const nextScale = Math.min(
          MAX_PINCH,
          Math.max(minScale / coverScale, startPinch.value * event.scale),
        );
        pinchScale.value = nextScale;
        const aabb = aabbSize(naturalWidth, naturalHeight, rotation, coverScale * nextScale);
        const next = clampTranslation(translateX.value, translateY.value, aabb.width, aabb.height, cropSize);
        translateX.value = next.x;
        translateY.value = next.y;
      });

    return Gesture.Simultaneous(pan, pinch);
  }, [
    coverScale,
    cropSize,
    naturalHeight,
    naturalWidth,
    pinchScale,
    rotation,
    startPinch,
    startX,
    startY,
    translateX,
    translateY,
  ]);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation}deg` },
      { scale: pinchScale.value },
    ],
  }));

  function handleConfirm() {
    if (!uri || !hasSize) {
      return;
    }

    const crop = buildCropFromViewport({
      imageWidth: naturalWidth,
      imageHeight: naturalHeight,
      rotation,
      cropSize,
      coverScale,
      pinchScale: pinchScale.value,
      translateX: translateX.value,
      translateY: translateY.value,
    });
    onConfirm(crop);
  }

  const displayWidth = hasSize ? naturalWidth * coverScale : 0;
  const displayHeight = hasSize ? naturalHeight * coverScale : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onShow={handleOpen}
      onRequestClose={onCancel}
    >
      <GestureHandlerRootView style={styles.flex}>
        <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.stage} onLayout={handleStageLayout}>
            {uri && hasSize ? (
              <GestureDetector gesture={composed}>
                <Animated.View style={styles.gestureLayer}>
                  <Animated.View
                    style={[
                      styles.photoWrap,
                      {
                        width: displayWidth,
                        height: displayHeight,
                        left: (stage.width - displayWidth) / 2,
                        top: (stage.height - displayHeight) / 2,
                      },
                      imageStyle,
                    ]}
                  >
                    <Image
                      source={{ uri }}
                      style={styles.photo}
                      contentFit="fill"
                      accessibilityLabel="Foto selecionada"
                    />
                  </Animated.View>
                </Animated.View>
              </GestureDetector>
            ) : uri ? (
              <Image
                source={{ uri }}
                style={styles.photoFallback}
                contentFit="cover"
                onLoad={(event) => {
                  const width = event.source.width;
                  const height = event.source.height;
                  if (width > 0 && height > 0) {
                    setLoadedSize({ width, height });
                  }
                }}
              />
            ) : null}

            <View style={styles.mask} pointerEvents="none">
              <View style={styles.maskBar} />
              <View style={styles.maskRow}>
                <View style={styles.maskBar} />
                <View style={[styles.cropWindow, { width: cropSize, height: cropSize }]}>
                  <CropCorners size={cropSize} />
                </View>
                <View style={styles.maskBar} />
              </View>
              <View style={styles.maskBar} />
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              disabled={confirming}
              onPress={onCancel}
              style={({ pressed }) => [styles.pill, styles.pillCancel, pressed && styles.pressed]}
            >
              <Text style={styles.pillCancelLabel}>Cancelar</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Girar foto"
              disabled={confirming}
              onPress={handleRotate}
              style={({ pressed }) => [styles.rotateButton, pressed && styles.pressed]}
            >
              <RefreshIcon size={16} color={BearCashColors.text} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirmar recorte"
              disabled={confirming || !uri || !hasSize}
              onPress={handleConfirm}
              style={({ pressed }) => [styles.pill, styles.pillOk, pressed && styles.pressed]}
            >
              {confirming ? (
                <ActivityIndicator color={BearCashColors.buttonFilledText} />
              ) : (
                <Text style={styles.pillOkLabel}>Ok</Text>
              )}
            </Pressable>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function buildCropFromViewport(input: {
  imageWidth: number;
  imageHeight: number;
  rotation: number;
  cropSize: number;
  coverScale: number;
  pinchScale: number;
  translateX: number;
  translateY: number;
}): ProfilePhotoCrop {
  const scale = input.coverScale * input.pinchScale;
  const displayW = input.imageWidth * scale;
  const displayH = input.imageHeight * scale;
  const relX = -input.cropSize / 2 - input.translateX;
  const relY = -input.cropSize / 2 - input.translateY;
  const rad = (-input.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const localX = relX * cos - relY * sin;
  const localY = relX * sin + relY * cos;
  const size = input.cropSize / scale;
  let originX = localX + displayW / 2;
  let originY = localY + displayH / 2;
  originX = (originX / displayW) * input.imageWidth;
  originY = (originY / displayH) * input.imageHeight;

  originX = Math.min(Math.max(0, originX), Math.max(0, input.imageWidth - size));
  originY = Math.min(Math.max(0, originY), Math.max(0, input.imageHeight - size));

  return {
    rotationDegrees: input.rotation,
    originX,
    originY,
    width: Math.min(size, input.imageWidth),
    height: Math.min(size, input.imageHeight),
  };
}

function CropCorners({ size }: { size: number }) {
  const inset = 4;
  const arm = CORNER_ARM;

  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Path
        d={`M${inset + arm} ${inset} H${inset} V${inset + arm}`}
        stroke={BearCashColors.text}
        strokeWidth={CORNER_STROKE}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d={`M${size - inset - arm} ${inset} H${size - inset} V${inset + arm}`}
        stroke={BearCashColors.text}
        strokeWidth={CORNER_STROKE}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d={`M${inset} ${size - inset - arm} V${size - inset} H${inset + arm}`}
        stroke={BearCashColors.text}
        strokeWidth={CORNER_STROKE}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d={`M${size - inset} ${size - inset - arm} V${size - inset} H${size - inset - arm}`}
        stroke={BearCashColors.text}
        strokeWidth={CORNER_STROKE}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  root: {
    flex: 1,
    backgroundColor: BearCashColors.background,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  stage: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: BearCashColors.neutralBase,
  },
  gestureLayer: {
    ...StyleSheet.absoluteFill,
  },
  photoWrap: {
    position: 'absolute',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    ...StyleSheet.absoluteFill,
  },
  mask: {
    ...StyleSheet.absoluteFill,
  },
  maskBar: {
    flex: 1,
    backgroundColor: 'rgba(46, 44, 48, 0.5)',
  },
  maskRow: {
    flexDirection: 'row',
  },
  cropWindow: {
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    minWidth: 96,
    minHeight: 36,
    borderRadius: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillCancel: {
    backgroundColor: BearCashColors.surface,
    paddingVertical: 8,
  },
  pillCancelLabel: {
    ...BearCashTypography.body,
    fontSize: 14,
    lineHeight: 22,
    color: BearCashColors.text,
  },
  pillOk: {
    backgroundColor: BearCashColors.buttonFilled,
    paddingVertical: 6,
  },
  pillOkLabel: {
    ...BearCashTypography.body,
    fontSize: 14,
    lineHeight: 22,
    color: BearCashColors.buttonFilledText,
  },
  rotateButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
