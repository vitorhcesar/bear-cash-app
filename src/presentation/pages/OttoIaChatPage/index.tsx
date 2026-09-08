import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthSession } from "@/presentation/auth/auth-session-context";
import { HomeSparkleIcon } from "@/presentation/components/ui/home-icons";
import {
  OttoIaChatIcon,
  OttoIaCloseIcon,
  OttoIaSendIcon,
} from "@/presentation/components/ui/otto-ia-icons";
import { OttoColors, OttoFonts, OttoTypography } from "@/presentation/constants/theme";

const OTTO_AVATAR = require("@/assets/images/otto-ia/avatar.png");
const INPUT_BG = "#212220";
const SEND_SIZE = 40;
const COMPOSER_GAP = 12;

const SUGGESTIONS = [
  "Quanto gastei este mês?",
  "Maiores despesas",
  "Dicas para economizar",
  "Resumo da semana",
] as const;

const FOOD_BREAKDOWN = [
  { label: "Restaurantes", amount: 240, color: "#e57830" },
  { label: "Supermercados", amount: 182.9, color: "#2fb70d" },
  { label: "Delivery", amount: 60, color: "#8a78e0" },
] as const;

const FOOD_TOTAL = 482.9;

type ChatMessage = {
  id: string;
  role: "otto" | "user";
  kind: "text" | "insight";
  text?: string;
};

function firstNameFromSession(
  displayName?: string | null,
  fullName?: string | null,
  userName?: string | null,
) {
  const raw =
    displayName?.trim() || fullName?.trim() || userName?.trim() || "";
  if (!raw) {
    return "";
  }
  const first = raw.split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function formatBrl(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function currentMonthLabel() {
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(
    new Date(),
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function repliesFor(text: string): Pick<ChatMessage, "role" | "kind" | "text">[] {
  const normalized = text.toLowerCase();
  if (
    normalized.includes("aliment") ||
    normalized.includes("gastei") ||
    normalized.includes("despesas")
  ) {
    return [{ role: "otto", kind: "insight" }];
  }
  if (normalized.includes("dica") || normalized.includes("economizar")) {
    return [
      {
        role: "otto",
        kind: "text",
        text: "Dica do Otto: Você economizou bastante evitando deliveries à noite. Continue assim para atingir sua meta!",
      },
    ];
  }
  if (normalized.includes("resumo") || normalized.includes("semana")) {
    return [
      {
        role: "otto",
        kind: "text",
        text: "Nesta semana seus gastos ficaram abaixo da média. Alimentação e transporte puxaram a maior parte — posso detalhar qualquer categoria.",
      },
    ];
  }
  return [
    {
      role: "otto",
      kind: "text",
      text: "Analisei suas contas conectadas. Me conte o que você quer olhar — gastos do mês, uma categoria ou uma meta de economia.",
    },
  ];
}

export function OttoIaChatPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuthSession();
  const scrollRef = useRef<ScrollView>(null);
  const idRef = useRef(0);

  const firstName = useMemo(
    () =>
      firstNameFromSession(
        profile?.displayName,
        profile?.fullName,
        user?.name,
      ),
    [profile?.displayName, profile?.fullName, user?.name],
  );

  const welcomeText = firstName
    ? `Olá, ${firstName}! Sou o Otto, seu assistente pessoal. Analisei suas contas conectadas hoje. Como posso guiar suas economias agora?`
    : "Olá! Sou o Otto, seu assistente pessoal. Analisei suas contas conectadas hoje. Como posso guiar suas economias agora?";

  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: "welcome", role: "otto", kind: "text", text: welcomeText },
  ]);

  const nextId = useCallback(() => {
    idRef.current += 1;
    return `msg-${idRef.current}`;
  }, []);

  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)");
  }

  function sendText(raw: string) {
    const text = raw.trim();
    if (!text) {
      return;
    }

    const userMessage: ChatMessage = {
      id: nextId(),
      role: "user",
      kind: "text",
      text,
    };
    const replies = repliesFor(text).map((message) => ({
      ...message,
      id: nextId(),
    }));

    setDraft("");
    setMessages((current) => [...current, userMessage, ...replies]);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }

  const monthLabel = useMemo(() => currentMonthLabel(), []);
  const canSend = draft.trim().length > 0;

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.userInfo}>
            <View style={styles.headerAvatar}>
              <Image
                source={OTTO_AVATAR}
                style={styles.headerAvatarImage}
                contentFit="cover"
                accessibilityLabel="Otto IA"
              />
            </View>
            <View style={styles.textStack}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>Otto IA</Text>
                <View style={styles.onlineDot} />
              </View>
              <Text style={styles.role}>Assistente de Finanças</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Conversas anteriores"
              onPress={() => router.push("/otto-ia-history")}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <OttoIaChatIcon size={24} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              onPress={goBack}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <OttoIaCloseIcon size={24} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => {
            if (message.kind === "insight") {
              return (
                <InsightBlock key={message.id} monthLabel={monthLabel} />
              );
            }
            if (message.role === "user") {
              return (
                <View key={message.id} style={styles.userBlock}>
                  <View style={styles.userBubble}>
                    <Text style={styles.bubbleText}>{message.text ?? ""}</Text>
                  </View>
                </View>
              );
            }
            return (
              <View key={message.id} style={styles.ottoBlock}>
                <View style={styles.bubbleAvatar}>
                  <Image
                    source={OTTO_AVATAR}
                    style={styles.bubbleAvatarImage}
                    contentFit="cover"
                  />
                </View>
                <View style={styles.ottoBubble}>
                  <Text style={styles.bubbleText}>{message.text ?? ""}</Text>
                </View>
              </View>
            );
          })}

          {messages.length === 1 ? (
            <View style={styles.suggestions}>
              <Text style={styles.suggestionsLabel}>Perguntas Sugeridas</Text>
              <View style={styles.suggestionsGrid}>
                {SUGGESTIONS.map((label) => (
                  <Pressable
                    key={label}
                    accessibilityRole="button"
                    onPress={() => sendText(label)}
                    style={({ pressed }) => [
                      styles.suggestionPill,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.suggestionText}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <Composer
            value={draft}
            onChangeText={setDraft}
            onSend={() => sendText(draft)}
            canSend={canSend}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Composer({
  value,
  onChangeText,
  onSend,
  canSend,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  canSend: boolean;
}) {
  return (
    <View style={styles.composerRow}>
      <View style={styles.inputPill}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder="Digite sua mensagem..."
          placeholderTextColor={OttoColors.textSoft}
          onSubmitEditing={onSend}
          returnKeyType="send"
          accessibilityLabel="Mensagem para o Otto IA"
        />
        <View style={styles.sparkleSlot}>
          <HomeSparkleIcon size={16} color={OttoColors.buttonFilled} />
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enviar"
        disabled={!canSend}
        onPress={onSend}
        style={({ pressed }) => [
          styles.sendButton,
          !canSend && styles.sendDisabled,
          pressed && canSend && styles.pressed,
        ]}
      >
        <OttoIaSendIcon size={16} />
      </Pressable>
    </View>
  );
}

function InsightBlock({ monthLabel }: { monthLabel: string }) {
  return (
    <View style={styles.ottoBlock}>
      <View style={styles.bubbleAvatar}>
        <Image
          source={OTTO_AVATAR}
          style={styles.bubbleAvatarImage}
          contentFit="cover"
        />
      </View>
      <View style={styles.insightBubble}>
        <View style={styles.insightHero}>
          <Text style={styles.insightKicker}>Alimentação • {monthLabel}</Text>
          <Text style={styles.insightAmount}>{formatBrl(FOOD_TOTAL)}</Text>
          <View style={styles.insightDeltaRow}>
            <Text style={styles.insightDelta}>−12% menor</Text>
            <Text style={styles.insightDeltaRest}>que o mês passado</Text>
          </View>
        </View>
        <View style={styles.insightDivider} />
        <View style={styles.breakdownList}>
          <Text style={styles.insightSectionTitle}>Principais Subcategorias:</Text>
          {FOOD_BREAKDOWN.map((item) => (
            <View key={item.label} style={styles.categoryBar}>
              <View style={styles.categoryMeta}>
                <Text style={styles.categoryLabel}>{item.label}</Text>
                <Text style={styles.categoryValue}>{formatBrl(item.amount)}</Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.trackFill,
                    {
                      width: `${(item.amount / FOOD_TOTAL) * 100}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.insightTip}>
          Dica do Otto: Você economizou bastante evitando deliveries à noite.
          Continue assim para atingir sua meta!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: OttoColors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: OttoColors.borderSoft,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 12,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: OttoColors.surface,
  },
  headerAvatarImage: {
    width: 44,
    height: 44,
  },
  textStack: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    ...OttoTypography.h3,
    color: OttoColors.text,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: OttoColors.primary,
  },
  role: {
    ...OttoTypography.captionSmall,
    color: OttoColors.textSoft,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: OttoColors.buttonFilled,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.85,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 20,
  },
  ottoBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  bubbleAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: OttoColors.surface,
  },
  bubbleAvatarImage: {
    width: 32,
    height: 32,
  },
  ottoBubble: {
    flex: 1,
    minWidth: 0,
    backgroundColor: OttoColors.surface,
    borderWidth: 1,
    borderColor: OttoColors.borderSoft,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 16,
  },
  bubbleText: {
    ...OttoTypography.bodySmall,
    color: OttoColors.text,
  },
  suggestions: {
    gap: 8,
  },
  suggestionsLabel: {
    ...OttoTypography.captionSmall,
    color: OttoColors.textSoft,
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionPill: {
    backgroundColor: OttoColors.surface,
    borderWidth: 1,
    borderColor: OttoColors.borderStrong,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  suggestionText: {
    ...OttoTypography.caption,
    color: OttoColors.textMid,
  },
  userBlock: {
    alignItems: "flex-end",
  },
  userBubble: {
    maxWidth: 260,
    backgroundColor: OttoColors.borderStrong,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
    padding: 16,
  },
  insightBubble: {
    flex: 1,
    minWidth: 0,
    backgroundColor: OttoColors.surface,
    borderWidth: 1,
    borderColor: OttoColors.borderSoft,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 16,
    gap: 16,
  },
  insightHero: {
    gap: 4,
  },
  insightKicker: {
    ...OttoTypography.captionSmall,
    color: OttoColors.textSoft,
  },
  insightAmount: {
    ...OttoTypography.h1,
    color: OttoColors.primarySoft,
  },
  insightDeltaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  insightDelta: {
    ...OttoTypography.captionSmall,
    color: OttoColors.income,
  },
  insightDeltaRest: {
    ...OttoTypography.captionSmall,
    color: OttoColors.textSoft,
  },
  insightDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: OttoColors.borderSoft,
  },
  insightSectionTitle: {
    ...OttoTypography.caption,
    fontFamily: OttoFonts.semiBold,
    color: OttoColors.textMid,
  },
  breakdownList: {
    gap: 12,
  },
  categoryBar: {
    gap: 6,
  },
  categoryMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryLabel: {
    ...OttoTypography.caption,
    color: OttoColors.text,
  },
  categoryValue: {
    ...OttoTypography.caption,
    color: OttoColors.text,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: OttoColors.borderSoft,
  },
  trackFill: {
    height: 6,
    borderRadius: 3,
  },
  insightTip: {
    ...OttoTypography.caption,
    color: OttoColors.textSoft,
  },
  footer: {
    backgroundColor: OttoColors.background,
    borderTopWidth: 1,
    borderTopColor: OttoColors.borderSoft,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: COMPOSER_GAP,
  },
  inputPill: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: OttoColors.borderStrong,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    ...OttoTypography.bodySmall,
    color: OttoColors.text,
  },
  sparkleSlot: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sendButton: {
    width: SEND_SIZE,
    height: SEND_SIZE,
    borderRadius: 999,
    backgroundColor: OttoColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: {
    opacity: 0.45,
  },
});
