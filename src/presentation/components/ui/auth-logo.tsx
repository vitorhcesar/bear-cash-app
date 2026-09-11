import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import {
  AUTH_BEAR_MARK_XML,
  AUTH_BEAR_WORDMARK_XML,
} from '@/presentation/components/ui/auth-logo-xml';

const MARK_WIDTH = 27.532;
const MARK_HEIGHT = 28.11;
const WORDMARK_WIDTH = 120.743;
const WORDMARK_HEIGHT = 28.202;
const LOGO_GAP = 8;

export function AuthLogo() {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="BearCash"
      style={styles.row}
    >
      <View style={styles.mark}>
        <SvgXml
          xml={AUTH_BEAR_MARK_XML}
          width={MARK_WIDTH}
          height={MARK_HEIGHT}
        />
      </View>
      <View style={styles.wordmark}>
        <SvgXml
          xml={AUTH_BEAR_WORDMARK_XML}
          width={WORDMARK_WIDTH}
          height={WORDMARK_HEIGHT}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LOGO_GAP,
  },
  mark: {
    width: MARK_WIDTH,
    height: MARK_HEIGHT,
    overflow: 'hidden',
  },
  wordmark: {
    width: WORDMARK_WIDTH,
    height: WORDMARK_HEIGHT,
    overflow: 'hidden',
  },
});
