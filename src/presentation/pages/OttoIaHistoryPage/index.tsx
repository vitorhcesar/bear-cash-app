import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getErrorMessage } from "@/infra/http/get-error-message";
import type { AiConversationSummary } from "@/infra/http/services/api/modules/ai.module";
import { SearchIcon } from "@/presentation/components/ui/activities-icons";
import { BackButton } from "@/presentation/components/ui/back-button";
import {
  OttoIaChatIcon,
  OttoIaPlusIcon,
} from "@/presentation/components/ui/otto-ia-icons";
import { OttoColors, OttoFonts, OttoTypography } from "@/presentation/constants/theme";
import { useApiService } from "@/presentation/hooks/use-api-service";

const OTTO_AVATAR = require("@/assets/images/otto-ia/avatar.png");

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
  const startTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
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

export function OttoIaHistoryPage() {
  const router = useRouter();
  const api = useApiService();
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<AiConversationSummary[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
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

  useFocusEffect(
    useCallback(() => {
      const handle = setTimeout(() => {
        void loadConversations(query);
      }, query ? 250 : 0);
      return () => clearTimeout(handle);
    }, [query, loadConversations]),
  );

  function openNewChat() {
    router.replace({
      pathname: "/otto-ia",
      params: { conversationId: undefined },
    });
  }

  function openChat(conversationId: string) {
    router.replace({
      pathname: "/otto-ia",
      params: { conversationId },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.headerArea}>
        <View style={styles.navRow}>
          <BackButton fallbackHref="/otto-ia" />
          <Text style={styles.navTitle}>Conversas anteriores</Text>
          <View style={styles.navIcon} accessibilityElementsHidden>
            <OttoIaChatIcon size={24} color={OttoColors.buttonFilled} />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nova conversa com Otto"
          onPress={openNewChat}
          style={({ pressed }) => [
            styles.newChatButton,
            pressed && styles.pressed,
          ]}
        >
          <OttoIaPlusIcon size={16} />
          <Text style={styles.newChatLabel}>Nova conversa com Otto</Text>
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchField}>
          <SearchIcon size={16} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar conversas passadas..."
            placeholderTextColor={OttoColors.textSoft}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={OttoColors.primarySoft} />
          </View>
        ) : error ? (
          <Text style={styles.emptyText}>{error}</Text>
        ) : conversations.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma conversa encontrada</Text>
        ) : (
          conversations.map((conversation, index) => (
            <View key={conversation.id}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={conversation.title}
                onPress={() => openChat(conversation.id)}
                style={({ pressed }) => [
                  styles.item,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.avatar}>
                  <Image
                    source={OTTO_AVATAR}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                </View>
                <View style={styles.itemCopy}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {conversation.title}
                    </Text>
                    <Text style={styles.itemTime}>
                      {formatConversationTime(conversation.updatedAt)}
                    </Text>
                  </View>
                  <View style={styles.itemPreviewRow}>
                    <Text style={styles.itemPreview} numberOfLines={1}>
                      {conversation.preview}
                    </Text>
                  </View>
                </View>
              </Pressable>
              {index < conversations.length - 1 ? (
                <View style={styles.divider} />
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: OttoColors.background,
  },
  flex: {
    flex: 1,
  },
  headerArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navTitle: {
    ...OttoTypography.h3,
    color: OttoColors.text,
  },
  navIcon: {
    width: 28,
    alignItems: "flex-end",
  },
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: OttoColors.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  newChatLabel: {
    fontFamily: OttoFonts.semiBold,
    fontSize: 14,
    lineHeight: 22,
    color: OttoColors.buttonFilledText,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: OttoColors.borderSoft,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    ...OttoTypography.body,
    color: OttoColors.text,
    padding: 0,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: OttoColors.surface,
  },
  avatarImage: {
    width: 44,
    height: 44,
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: OttoFonts.semiBold,
    fontSize: 14,
    lineHeight: 22,
    color: OttoColors.text,
  },
  itemTime: {
    ...OttoTypography.captionSmall,
    color: OttoColors.textSoft,
  },
  itemPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemPreview: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 19,
    fontFamily: OttoFonts.regular,
    color: OttoColors.textMid,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: OttoColors.borderSoft,
  },
  emptyText: {
    ...OttoTypography.bodySmall,
    color: OttoColors.textSoft,
    paddingHorizontal: 16,
    paddingTop: 24,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.85,
  },
});
