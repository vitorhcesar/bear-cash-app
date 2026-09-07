import { StyleSheet, View } from 'react-native';

import { BackButton } from '@/presentation/components/ui/back-button';
import { StepGroup } from '@/presentation/components/ui/step-group';

type AuthFlowHeaderProps = {
  total: number;
  current: number;
};

export function AuthFlowHeader({ total, current }: AuthFlowHeaderProps) {
  return (
    <View style={styles.topBar}>
      <BackButton fallbackHref="/" style={styles.backButton} />
      <StepGroup total={total} current={current} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 8,
  },
  backButton: {
    position: 'absolute',
    left: 24,
    zIndex: 2,
  },
});
