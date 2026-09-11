import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RefreshIcon } from '@/presentation/components/ui/auth-icons';
import { BearCashColors, BearCashTypography } from '@/presentation/constants/theme';

const CORNER_ARM = 28;
const CORNER_STROKE = 2.5;

export type AvatarCropSheetProps = {
  visible: boolean;
  uri: string | null;
  confirming?: boolean;
  onCancel: () => void;
  onConfirm: (rotationDegrees: number) => void;
};

export function AvatarCropSheet({
  visible,
  uri,
  confirming = false,
  onCancel,
  onConfirm,
}: AvatarCropSheetProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [rotation, setRotation] = useState(0);
  const cropSize = Math.min(windowWidth - 64, 280);

  const handleOpen = useCallback(() => {
    setRotation(0);
  }, []);

  function handleRotate() {
    setRotation((current) => (current + 90) % 360);
  }

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
      <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.stage}>
          {uri ? (
            <Image
              source={{ uri }}
              style={[styles.photo, { transform: [{ rotate: `${rotation}deg` }] }]}
              contentFit="cover"
              accessibilityLabel="Foto selecionada"
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
            disabled={confirming || !uri}
            onPress={() => onConfirm(rotation)}
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
    </Modal>
  );
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
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

