import * as Clipboard from 'expo-clipboard';
import { useCallback, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getErrorMessage } from '@/infra/http/get-error-message';
import type { CreatedApiKey } from '@/infra/http/services/api/modules/api-keys.module';
import {
  ApiKeyGlyphIcon,
  CalendarIcon,
  CopyIcon,
  InfoCircleIcon,
} from '@/presentation/components/ui/api-keys-icons';
import { Button } from '@/presentation/components/ui/button';
import { Sheet } from '@/presentation/components/ui/sheet';
import { BearCashColors, BearCashTypography } from '@/presentation/constants/theme';
import { useApiService } from '@/presentation/hooks/use-api-service';

export type CreateApiKeySheetProps = {
  visible: boolean;
  onClose: () => void;
  onCreated: (key: CreatedApiKey) => void;
};

function formatCreatedAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function CreateApiKeySheet({
  visible,
  onClose,
  onCreated,
}: CreateApiKeySheetProps) {
  const api = useApiService();
  const [name, setName] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<CreatedApiKey | null>(null);

  const trimmed = name.trim();
  const showFloatingLabel = focused || trimmed.length > 0 || Boolean(created);

  const handleOpen = useCallback(() => {
    setName('');
    setFocused(false);
    setLoading(false);
    setCreated(null);
  }, []);

  async function copySecret(secret: string) {
    await Clipboard.setStringAsync(secret);
    Alert.alert('Copiado', 'A chave foi copiada para a área de transferência.');
  }

  async function handlePrimaryAction() {
    if (created) {
      await copySecret(created.secret);
      return;
    }

    if (!trimmed || loading) {
      return;
    }

    setLoading(true);
    try {
      const result = await api.modules.apiKeys.create(trimmed);
      setCreated(result);
      onCreated(result);
      await Clipboard.setStringAsync(result.secret);
    } catch (error) {
      Alert.alert(
        'Erro',
        getErrorMessage(error, 'Não foi possível criar a API Key.'),
      );
    } finally {
      setLoading(false);
    }
  }

  const title = created
    ? `Criar API Key: ${created.name}`
    : 'Criar API Key';

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      onOpen={handleOpen}
      title={title}
    >
      <View style={styles.fieldWrap}>
        {showFloatingLabel ? (
          <View style={styles.labelRow} pointerEvents="none">
            <View style={styles.labelBackground}>
              <Text style={styles.floatingLabel}>Identifique a chave</Text>
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.inputShell,
            showFloatingLabel ? styles.inputShellActive : styles.inputShellIdle,
            created && styles.inputShellCreated,
          ]}
        >
          <View style={styles.leadingIcon}>
            <ApiKeyGlyphIcon
              size={16}
              color={created ? BearCashColors.textMid : BearCashColors.primary}
            />
          </View>

          {created ? (
            <Text style={styles.secretText} selectable>
              {created.secret}
            </Text>
          ) : (
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={
                showFloatingLabel ? undefined : 'Identifique a chave'
              }
              placeholderTextColor={BearCashColors.textSoft}
              style={styles.input}
              autoCapitalize="words"
              maxLength={80}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          )}
        </View>
      </View>

      {created ? (
        <View style={styles.metaRow}>
          <CalendarIcon size={16} color={BearCashColors.textSoft} />
          <Text style={styles.metaText}>
            Criada em {formatCreatedAt(created.createdAt)}
          </Text>
        </View>
      ) : (
        <View style={styles.metaRow}>
          <InfoCircleIcon size={16} />
          <Text style={styles.metaText}>
            Insira um nome que identifique o propósito da sua nova chave de API
          </Text>
        </View>
      )}

      <Button
        label="Copiar"
        variant="filled"
        loading={loading}
        disabled={!created && !trimmed}
        rightIcon={<CopyIcon size={16} color={BearCashColors.buttonFilledText} />}
        onPress={handlePrimaryAction}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
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
    paddingVertical: 12,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputShellIdle: {
    borderColor: BearCashColors.borderSoft,
  },
  inputShellActive: {
    borderColor: BearCashColors.borderStrong,
  },
  inputShellCreated: {
    minHeight: 64,
    alignItems: 'flex-start',
  },
  leadingIcon: {
    width: 16,
    height: 16,
    marginTop: 2,
  },
  input: {
    ...BearCashTypography.body,
    color: BearCashColors.text,
    flex: 1,
    padding: 0,
    margin: 0,
  },
  secretText: {
    ...BearCashTypography.caption,
    color: BearCashColors.textMid,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  metaText: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
    flex: 1,
  },
});
