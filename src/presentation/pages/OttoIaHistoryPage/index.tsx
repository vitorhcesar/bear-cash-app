import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SearchIcon } from "@/presentation/components/ui/activities-icons";
import { BackButton } from "@/presentation/components/ui/back-button";
import {
  OttoIaChatIcon,
  OttoIaPlusIcon,
} from "@/presentation/components/ui/otto-ia-icons";
import { OttoColors, OttoFonts, OttoTypography } from "@/presentation/constants/theme";

const OTTO_AVATAR = require("@/assets/images/otto-ia/avatar.png");

type Conversation = {
  id: string;
  title: string;
  time: string;
  preview: string;
  unread?: boolean;
};

const CONVERSATIONS: Conversation[] = [
  {
    id: "food",
    title: "Gastos com alimentação",
    time: "Hoje, 14:30",
    preview: "Você economizou R$ 150,00 evitando deliveries essa semana.",
    unread: true,
  },
  {
    id: "subs",
    title: "Análise de assinaturas",
    time: "Ontem, 18:15",
    preview: "Identifiquei 3 serviços recorrentes que você não utiliza muito.",
  },
  {
    id: "tips",
    title: "Dicas para economizar",
    time: "2 Set",
    preview: "Tente cozinhar em lote aos domingos para reduzir custos.",
  },
  {
    id: "august",
    title: "Resumo mensal: Agosto",
    time: "28 Ago",
    preview: "Seu patrimônio cresceu 4.2% em relação a Julho.",
  },
  {
    id: "reserve",
    title: "Meta de reserva de emergência",
    time: "15 Ago",
    preview: "Faltam apenas R$ 400,00 para atingir seu objetivo de 3 meses.",
  },
  {
    id: "trip",
    title: "Planejamento de viagem",
    time: "10 Ago",
    preview: "Com o ritmo atual, você poderá viajar em Dezembro.",
  },
  {
    id: "limit",
    title: "Alerta de limite estourado",
    time: "02 Ago",
    preview: "A categoria 'Lazer' ultrapassou o limite em R$ 42,90.",
  },
  {
    id: "setup",
    title: "Primeira configuração",
    time: "28 Jul",
    preview: "Contas conectadas com sucesso. Pronto para analisar seus dados!",
  },
];

function matchesQuery(conversation: Conversation, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return (
    conversation.title.toLowerCase().includes(normalized) ||
    conversation.preview.toLowerCase().includes(normalized)
  );
}

export function OttoIaHistoryPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const conversations = useMemo(
    () => CONVERSATIONS.filter((item) => matchesQuery(item, query)),
    [query],
  );

  function openChat() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/otto-ia");
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
          onPress={openChat}
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
        {conversations.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma conversa encontrada</Text>
        ) : (
          conversations.map((conversation, index) => (
            <View key={conversation.id}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={conversation.title}
                onPress={openChat}
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
                    <Text style={styles.itemTime}>{conversation.time}</Text>
                  </View>
                  <View style={styles.itemPreviewRow}>
                    <Text style={styles.itemPreview} numberOfLines={1}>
                      {conversation.preview}
                    </Text>
                    {conversation.unread ? (
                      <View style={styles.unreadDot} />
                    ) : null}
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
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: OttoColors.primarySoft,
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
