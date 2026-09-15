import { StyleSheet, View } from 'react-native';

import {
  AI_ICON_XML,
  HOME_ICON_XML,
  BEAR_CASH_MARK_XML,
  WALLET_ICON_XML,
} from '@/presentation/components/ui/figma-tab-icon-xml';
import { FigmaSvgIcon } from '@/presentation/components/ui/figma-svg-icon';
import { BearCashColors } from '@/presentation/constants/theme';
import { createThemedStyles } from '@/presentation/constants/themed-styles';

type TintableIconProps = {
  size?: number;
  color: string;
};

export function HomeTabGlyph({ size = 24, color }: TintableIconProps) {
  return <FigmaSvgIcon xml={HOME_ICON_XML} size={size} color={color} />;
}

export function WalletTabGlyph({ size = 24, color }: TintableIconProps) {
  return <FigmaSvgIcon xml={WALLET_ICON_XML} size={size} color={color} />;
}

export function AiAskGlyph({ size = 24, color }: TintableIconProps) {
  return <FigmaSvgIcon xml={AI_ICON_XML} size={size} color={color} />;
}

export function BearCashMarkGlyph() {
  const styles = useStyles();
  return (
    <View style={styles.markWrap}>
      <FigmaSvgIcon
        xml={BEAR_CASH_MARK_XML}
        size={28}
        glyphWidth={27.425}
        glyphHeight={28}
        box={28}
      />
    </View>
  );
}

export function BearCashMarkBadge({ size = 20 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: BearCashColors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: BearCashColors.borderSoft,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <FigmaSvgIcon
        xml={BEAR_CASH_MARK_XML}
        size={size}
        glyphWidth={27.425}
        glyphHeight={28}
        box={28}
      />
    </View>
  );
}

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
    markWrap: {
      width: 27.425,
      height: 28,
      overflow: 'hidden',
    },
  }),
);
