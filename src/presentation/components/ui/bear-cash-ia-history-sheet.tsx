import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { getErrorMessage } from "@/infra/http/get-error-message";
import type { AiConversationSummary } from "@/infra/http/services/api/modules/ai.module";
import { SearchIcon } from "@/presentation/components/ui/activities-icons";
import { BearCashIaPlusIcon } from "@/presentation/components/ui/bear-cash-ia-icons";
import { MarkdownPreview } from "@/presentation/components/ui/markdown-message";
import { Sheet } from "@/presentation/components/ui/sheet";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";
import { useApiService } from "@/presentation/hooks/use-api-service";

export type BearCashIaHistorySheetProps = {
  visible: boolean;
  activeConversationId?: string;
  onClose: () => void;
  onSelect: (conversationId: string) => void;
  onNewChat: () => void;
};

function formatConversationTime(iso: string, now = new Date()) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startTarget = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round(
    (startToday.getTime() - startTarget.getTime()) / 86_400_000,
  );

  if (diffDays === 0) {
    return `Hoje, ${time}`;
  }
  if (diffDays === 1) {
    return `Ontem, ${time}`;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function BearCashIaHistorySheet({
  visible,
  activeConversationId,
  onClose,
  onSelect,
  onNewChat,
}: BearCashIaHistorySheetProps) {
  const styles = useStyles();
  const api = useApiService();
  const { height } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<AiConversationSummary[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(
    async (search?: string) => {
      setLoading(true);
      try {
        const response = await api.modules.ai.listConversations(search);
        setConversations(response.items);
        setError(null);
      } catch (loadError) {
        setError(
          getErrorMessage(
            loadError,
            "Não foi possível carregar as conversas.",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [api.modules.ai],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (!query) {
      setLoading(true);
    }

    const handle = setTimeout(
      () => {
        void loadConversations(query);
      },
      query ? 250 : 0,
    );
    return () => clearTimeout(handle);
  }, [visible, query, loadConversations]);

  function handleClose() {
    setQuery("");
    onClose();
  }

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title="Conversas anteriores"
      contentStyle={[styles.sheet, { height: Math.round(height * 0.72) }]}
    >
      <View style={styles.searchField}>
        <SearchIcon size={16} color={BearCashColors.textSoft} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar conversas"
          placeholderTextColor={BearCashColors.textSoft}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Pesquisar conversas anteriores"
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nova conversa"
        onPress={onNewChat}
        style={({ pressed }) => [styles.newChatRow, pressed && styles.pressed]}
      >
        <View style={styles.newChatIcon}>
          <BearCashIaPlusIcon size={14} color={BearCashColors.onText} />
        </View>
        <Text style={styles.newChatLabel}>Nova conversa</Text>
      </Pressable>

      <View style={styles.sectionDivider} />

      <View style={styles.body}>
        {loading && conversations.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={BearCashColors.primarySoft} />
          </View>
        ) : error ? (
          <Text style={styles.emptyText}>{error}</Text>
        ) : conversations.length === 0 ? (
          <Text style={styles.emptyText}>
            {query.trim()
              ? "Nenhuma conversa encontrada"
              : "Nenhuma conversa ainda"}
          </Text>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.itemDivider} />}
            renderItem={({ item }) => {
              const active = item.id === activeConversationId;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                  accessibilityState={{ selected: active }}
                  onPress={() => onSelect(item.id)}
                  style={({ pressed }) => [
                    styles.item,
                    active && styles.itemActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.itemCopy}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.itemTime}>
                        {formatConversationTime(item.updatedAt)}
                      </Text>
                    </View>
                    {item.preview ? (
                      <MarkdownPreview
                        content={item.preview}
                        numberOfLines={2}
                        style={styles.itemPreview}
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </Sheet>
  );
}

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
    sheet: {
      paddingHorizontal: 16,
      gap: 12,
    },
    searchField: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 44,
      backgroundColor: BearCashColors.neutralBase,
      borderRadius: 999,
      paddingHorizontal: 14,
    },
    searchInput: {
      flex: 1,
      minWidth: 0,
      padding: 0,
      ...BearCashTypography.body,
      color: BearCashColors.text,
    },
    newChatRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    newChatIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: BearCashColors.text,
      alignItems: "center",
      justifyContent: "center",
    },
    newChatLabel: {
      ...BearCashTypography.subheading,
      color: BearCashColors.text,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: BearCashColors.borderStrong,
    },
    body: {
      flex: 1,
      minHeight: 0,
    },
    list: {
      flex: 1,
      minHeight: 0,
      marginHorizontal: -4,
    },
    listContent: {
      paddingBottom: 8,
    },
    itemDivider: {
      height: 1,
      backgroundColor: BearCashColors.borderStrong,
      marginHorizontal: 12,
    },
    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    item: {
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 14,
    },
    itemActive: {
      backgroundColor: BearCashColors.surface,
    },
    itemCopy: {
      gap: 4,
    },
    itemHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    itemTitle: {
      flex: 1,
      minWidth: 0,
      fontFamily: BearCashFonts.semiBold,
      fontSize: 14,
      lineHeight: 20,
      color: BearCashColors.text,
    },
    itemTime: {
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textSoft,
    },
    itemPreview: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BearCashFonts.regular,
      color: BearCashColors.textMid,
    },
    emptyText: {
      ...BearCashTypography.bodySmall,
      color: BearCashColors.textSoft,
      textAlign: "center",
      paddingTop: 32,
    },
    pressed: {
      opacity: 0.82,
    },
  }),
);
