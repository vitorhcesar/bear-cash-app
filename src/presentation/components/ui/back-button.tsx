import { useRouter, type Href } from 'expo-router';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { BackArrowIcon } from '@/presentation/components/ui/activities-icons';
import { useIconColor } from '@/presentation/components/ui/figma-svg-icon';

export type BackButtonProps = Omit<PressableProps, 'children' | 'onPress'> & {
  onPress?: () => void;
  /** Used when there is no history to go back to */
  fallbackHref?: Href;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/** Standard navigation back control used across authenticated screens. */
export function BackButton({
  onPress,
  fallbackHref = '/(tabs)',
  size = 28,
  color,
  accessibilityLabel = 'Voltar',
  hitSlop = 8,
  ...rest
}: BackButtonProps) {
  const router = useRouter();
  const resolvedColor = useIconColor(color);

  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackHref);
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      onPress={handlePress}
      {...rest}
    >
      <BackArrowIcon size={size} color={resolvedColor} />
    </Pressable>
  );
}
