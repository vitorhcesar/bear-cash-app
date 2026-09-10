import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { OTTO_LOGO_XML } from '@/presentation/components/ui/auth-logo-xml';

const LOGO_WIDTH = 120.322;
const LOGO_HEIGHT = 33;

export function AuthLogo() {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Otto"
      style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT, overflow: 'hidden' }}
    >
      <SvgXml xml={OTTO_LOGO_XML} width={LOGO_WIDTH} height={LOGO_HEIGHT} />
    </View>
  );
}
