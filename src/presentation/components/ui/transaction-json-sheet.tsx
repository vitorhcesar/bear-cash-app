import * as Clipboard from 'expo-clipboard';
import { Alert, ScrollView, StyleSheet, Text, useWindowDimensions } from 'react-native';

import { CopyIcon } from '@/presentation/components/ui/api-keys-icons';
import { Button } from '@/presentation/components/ui/button';
import { Sheet } from '@/presentation/components/ui/sheet';
import { BearCashColors, BearCashTypography, Fonts } from '@/presentation/constants/theme';
import { createThemedStyles } from '@/presentation/constants/themed-styles';

export type TransactionJsonSheetProps = {
  visible: boolean;
  payload: unknown;
  onClose: () => void;
};

export function formatTransactionJson(payload: unknown) {
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

export function TransactionJsonSheet({
  visible,
  payload,
  onClose,
}: TransactionJsonSheetProps) {
  const styles = useStyles();
  const { height } = useWindowDimensions();
  const json = formatTransactionJson(payload);

  async function copyJson() {
    await Clipboard.setStringAsync(json);
    Alert.alert('Copiado', 'JSON copiado para a área de transferência.');
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="JSON da transação"
      subtitle="Dados completos da transação. Disponível apenas no modo beta."
    >
      <ScrollView
        style={[styles.jsonScroll, { maxHeight: Math.round(height * 0.55) }]}
        contentContainerStyle={styles.jsonContent}
        showsVerticalScrollIndicator
        nestedScrollEnabled
      >
        <Text style={styles.jsonText} selectable>
          {json}
        </Text>
      </ScrollView>
      <Button
        label="Copiar JSON"
        variant="stroke"
        rightIcon={<CopyIcon size={16} color={BearCashColors.text} />}
        onPress={() => {
          void copyJson();
        }}
      />
    </Sheet>
  );
}

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
    jsonScroll: {
      backgroundColor: BearCashColors.surface,
      borderRadius: 12,
    },
    jsonContent: {
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    jsonText: {
      fontFamily: Fonts.mono,
      fontSize: 12,
      lineHeight: 18,
      color: BearCashColors.textMid,
    },
  }),
);
