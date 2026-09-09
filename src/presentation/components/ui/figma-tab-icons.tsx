import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import {
  AI_ICON_XML,
  HOME_ICON_XML,
  BEAR_CASH_MARK_XML,
  WALLET_ICON_XML,
} from '@/presentation/components/ui/figma-tab-icon-xml';
import { BearCashColors } from '@/presentation/constants/theme';

type TintableIconProps = {
  size?: number;
  color: string;
};

function tintFigmaIcon(xml: string, color: string) {
  return xml.replace(/#(?:E0E2DF|95FF52)/gi, color);
}

function TintableFigmaIcon({
  xml,
  size = 24,
  color,
}: TintableIconProps & { xml: string }) {
  const tintedXml = useMemo(() => tintFigmaIcon(xml, color), [xml, color]);

  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <SvgXml xml={tintedXml} width={size} height={size} />
    </View>
  );
}

export function HomeTabGlyph({ size = 24, color }: TintableIconProps) {
  return <TintableFigmaIcon xml={HOME_ICON_XML} size={size} color={color} />;
}

export function WalletTabGlyph({ size = 24, color }: TintableIconProps) {
  return <TintableFigmaIcon xml={WALLET_ICON_XML} size={size} color={color} />;
}

export function AiAskGlyph({ size = 24, color }: TintableIconProps) {
  return <TintableFigmaIcon xml={AI_ICON_XML} size={size} color={color} />;
}

export function BearCashMarkGlyph() {
  return (
    <View style={styles.markWrap}>
      <SvgXml xml={BEAR_CASH_MARK_XML} width={27.425} height={28} />
    </View>
  );
}

export function BearCashMarkBadge({ size = 20 }: { size?: number }) {
  const scale = size / 28;

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
      <SvgXml
        xml={BEAR_CASH_MARK_XML}
        width={27.425 * scale}
        height={28 * scale}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  markWrap: {
    width: 27.425,
    height: 28,
    overflow: 'hidden',
  },
});
