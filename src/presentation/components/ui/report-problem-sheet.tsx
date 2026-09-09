import { useCallback, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getErrorMessage } from '@/infra/http/get-error-message';
import { PROBLEM_REPORT_MAX_LENGTH } from '@/infra/http/services/api/modules/support.module';
import { Button } from '@/presentation/components/ui/button';
import { Sheet } from '@/presentation/components/ui/sheet';
import { BearCashColors, BearCashTypography } from '@/presentation/constants/theme';
import { useApiService } from '@/presentation/hooks/use-api-service';

export type ReportProblemSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
};

export function ReportProblemSheet({
  visible,
  onClose,
  onSubmitted,
}: ReportProblemSheetProps) {
  const api = useApiService();
  const [message, setMessage] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const trimmed = message.trim();
  const canSubmit = trimmed.length > 0 && !loading;
  const showFloatingLabel = focused || message.length > 0;

  const handleOpen = useCallback(() => {
    setMessage('');
    setFocused(false);
  }, []);

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setLoading(true);
    try {
      await api.modules.support.createProblemReport(trimmed);
      onSubmitted?.();
      onClose();
      Alert.alert('Enviado', 'Obrigado pelo seu relato.');
    } catch (error) {
      Alert.alert(
        'Erro',
        getErrorMessage(
          error,
          'Não foi possível enviar o relato. Tente novamente.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      onOpen={handleOpen}
      title="Reportar um problema"
      closeIconColor={BearCashColors.primary}
    >
      <Text style={styles.disclaimer}>
        Esse não é um canal de comunicação direto com o time de atendimento do
        BearCash, você não será respondido ou contatado a partir desse formulário
      </Text>

      <View style={styles.fieldWrap}>
        {showFloatingLabel ? (
          <View style={styles.labelRow} pointerEvents="none">
            <View style={styles.labelBackground}>
              <Text style={styles.floatingLabel}>Por favor, conte-nos mais</Text>
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.inputShell,
            showFloatingLabel ? styles.inputShellActive : styles.inputShellIdle,
          ]}
        >
          <TextInput
            value={message}
            onChangeText={(text) =>
              setMessage(text.slice(0, PROBLEM_REPORT_MAX_LENGTH))
            }
            placeholder={
              showFloatingLabel ? undefined : 'Por favor, conte-nos mais'
            }
            placeholderTextColor={BearCashColors.textSoft}
            multiline
            textAlignVertical="top"
            maxLength={PROBLEM_REPORT_MAX_LENGTH}
            style={styles.input}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          <Text style={styles.counter}>
            {message.length}/{PROBLEM_REPORT_MAX_LENGTH}
          </Text>
        </View>
      </View>

      <Button
        label="Enviar"
        variant="filled"
        loading={loading}
        disabled={!canSubmit}
        onPress={handleSubmit}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  disclaimer: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  fieldWrap: {
    alignSelf: 'stretch',
    position: 'relative',
  },
  labelRow: {
    position: 'absolute',
    top: -8,
    left: 13,
    zIndex: 2,
  },
  labelBackground: {
    backgroundColor: BearCashColors.background,
    paddingHorizontal: 4,
  },
  floatingLabel: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.text,
  },
  inputShell: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 140,
  },
  inputShellIdle: {
    borderColor: BearCashColors.borderSoft,
  },
  inputShellActive: {
    borderColor: BearCashColors.borderStrong,
  },
  input: {
    ...BearCashTypography.body,
    color: BearCashColors.text,
    minHeight: 96,
    padding: 0,
    margin: 0,
  },
  counter: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.textSoft,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
});
