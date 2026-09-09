import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/infra/http/get-error-message';
import type { ApiKeyItem } from '@/infra/http/services/api/modules/api-keys.module';
import { PlusIcon, SearchIcon } from '@/presentation/components/ui/activities-icons';
import { ApiKeyGlyphIcon } from '@/presentation/components/ui/api-keys-icons';
import { BackButton } from '@/presentation/components/ui/back-button';
import { CreateApiKeySheet } from '@/presentation/components/ui/create-api-key-sheet';
import { DeleteApiKeySheet } from '@/presentation/components/ui/delete-api-key-sheet';
import { TrashIcon } from '@/presentation/components/ui/profile-icons';
import { BearCashColors, BearCashFonts, BearCashTypography } from '@/presentation/constants/theme';
import { useApiService } from '@/presentation/hooks/use-api-service';

export function ApiKeysPage() {
  const api = useApiService();
  const [query, setQuery] = useState('');
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadKeys = useCallback(
    async (search?: string) => {
      setLoading(true);
      try {
        const response = await api.modules.apiKeys.list(search);
        setKeys(response.items);
      } catch (error) {
        Alert.alert(
          'Erro',
          getErrorMessage(error, 'Não foi possível carregar as API Keys.'),
        );
      } finally {
        setLoading(false);
      }
    },
    [api.modules.apiKeys],
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      void loadKeys(query);
    }, query ? 250 : 0);
    return () => clearTimeout(handle);
  }, [query, loadKeys]);

  const emptyLabel = useMemo(() => {
    if (loading) {
      return 'Carregando…';
    }
    if (query.trim()) {
      return 'Nenhuma chave encontrada para essa busca';
    }
    return 'Você ainda não criou nenhuma API Key';
  }, [loading, query]);

  async function handleToggle(item: ApiKeyItem, isActive: boolean) {
    const previous = keys;
    setKeys((current) =>
      current.map((key) => (key.id === item.id ? { ...key, isActive } : key)),
    );
    try {
      const updated = await api.modules.apiKeys.setActive(item.id, isActive);
      setKeys((current) =>
        current.map((key) => (key.id === updated.id ? updated : key)),
      );
    } catch (error) {
      setKeys(previous);
      Alert.alert(
        'Erro',
        getErrorMessage(error, 'Não foi possível atualizar a chave.'),
      );
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    try {
      await api.modules.apiKeys.remove(deleteTarget.id);
      setKeys((current) =>
        current.filter((key) => key.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (error) {
      Alert.alert(
        'Erro',
        getErrorMessage(error, 'Não foi possível excluir a chave.'),
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <BackButton />
            <View style={styles.headerCopy}>
              <Text style={styles.title}>API Key</Text>
              <Text style={styles.subtitle}>
                Crie diferentes chaves para diferentes funções
              </Text>
            </View>
          </View>

          <View style={styles.searchField}>
            <SearchIcon size={16} color={BearCashColors.primary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Procurar por suas chaves"
              placeholderTextColor={BearCashColors.textSoft}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>

          <View style={styles.list}>
            {keys.length === 0 ? (
              <Text style={styles.emptyText}>{emptyLabel}</Text>
            ) : (
              keys.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardIcon}>
                    <ApiKeyGlyphIcon size={16} color={BearCashColors.textMid} />
                  </View>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardPrefix}>{item.keyPrefix}</Text>
                  </View>
                  <Switch
                    value={item.isActive}
                    onValueChange={(value) => handleToggle(item, value)}
                    trackColor={{
                      false: BearCashColors.borderStrong,
                      true: BearCashColors.primary,
                    }}
                    thumbColor={BearCashColors.text}
                    ios_backgroundColor={BearCashColors.borderStrong}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir ${item.name}`}
                    hitSlop={8}
                    onPress={() => setDeleteTarget(item)}
                  >
                    <TrashIcon size={16} color={BearCashColors.danger} />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Criar API Key"
          style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
          onPress={() => setCreateOpen(true)}
        >
          <PlusIcon size={24} color={BearCashColors.buttonFilledText} />
        </Pressable>
      </View>

      <CreateApiKeySheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(created) => {
          setKeys((current) => [
            {
              id: created.id,
              name: created.name,
              keyPrefix: created.keyPrefix,
              isActive: created.isActive,
              createdAt: created.createdAt,
            },
            ...current.filter((key) => key.id !== created.id),
          ]);
        }}
      />

      <DeleteApiKeySheet
        visible={Boolean(deleteTarget)}
        keyName={deleteTarget?.name}
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BearCashColors.background,
  },
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 24,
  },
  header: {
    gap: 16,
  },
  headerCopy: {
    gap: 4,
  },
  title: {
    ...BearCashTypography.h1,
    color: BearCashColors.text,
  },
  subtitle: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: BearCashColors.borderSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: BearCashColors.surface,
  },
  searchInput: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.text,
    flex: 1,
    padding: 0,
    margin: 0,
  },
  list: {
    gap: 12,
  },
  emptyText: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
    textAlign: 'center',
    paddingVertical: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: BearCashColors.surface,
    borderRadius: 12,
    padding: 12,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BearCashColors.neutralBlackSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: BearCashColors.text,
  },
  cardPrefix: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BearCashColors.buttonFilled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
