import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getErrorMessage } from "@/infra/http/get-error-message";
import type { AiMessage } from "@/infra/http/services/api/modules/ai.module";
import { useAuthSession } from "@/presentation/auth/auth-session-context";
import { BearCashMascotIcon } from "@/presentation/components/ui/bank-connection-icons";
import { BearCashIaHistorySheet } from "@/presentation/components/ui/bear-cash-ia-history-sheet";
import { BearCashIaScreenTransition } from "@/presentation/components/ui/bear-cash-ia-screen-transition";
import {
  BearCashIaClockIcon,
  BearCashIaCloseIcon,
  BearCashIaPlusIcon,
  BearCashIaSendIcon,
} from "@/presentation/components/ui/bear-cash-ia-icons";
import { MarkdownMessage } from "@/presentation/components/ui/markdown-message";
import { SettingsRocketIcon } from "@/presentation/components/ui/settings-icons";
import { BearCashColors, BearCashFonts, BearCashTypography } from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";
import { useApiService } from "@/presentation/hooks/use-api-service";

const SEND_SIZE = 36;
const CIRCLE_BUTTON = 44;
const COMPOSER_GAP = 10;

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
  role: "bear-cash" | "user";
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

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function toChatMessages(items: AiMessage[]): ChatMessage[] {
  return items.map((item) => ({
    id: item.id,
    role: item.role === "user" ? "user" : "bear-cash",
    kind: "text",
    text: item.content,
  }));
}

export function BearCashIaChatPage() {
  const styles = useStyles();
  const router = useRouter();
  const api = useApiService();
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuthSession();
  const params = useLocalSearchParams<{ conversationId?: string | string[] }>();
  const paramConversationId = firstParam(params.conversationId);
  const scrollRef = useRef<ScrollView>(null);
  const idRef = useRef(0);
  const skipNextLoad = useRef(false);
  const pinToBottom = useRef(true);

  const firstName = useMemo(
    () =>
      firstNameFromSession(
        profile?.displayName,
        profile?.fullName,
        user?.name,
      ),
    [profile?.displayName, profile?.fullName, user?.name],
  );

  const greeting = firstName ? `Olá, ${firstName}` : "Olá";

  const [draft, setDraft] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>(
    paramConversationId,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversation, setLoadingConversation] = useState(
    Boolean(paramConversationId),
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const nextId = useCallback(() => {
    idRef.current += 1;
    return `msg-${idRef.current}`;
  }, []);

  const scrollToEnd = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated });
    });
  }, []);

  function handleContentSizeChange() {
    if (!pinToBottom.current || loadingConversation) {
      return;
    }
    scrollRef.current?.scrollToEnd({ animated: false });
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    pinToBottom.current = distanceFromBottom < 64;
  }

  useEffect(() => {
    if (skipNextLoad.current) {
      skipNextLoad.current = false;
      return;
    }

    if (!paramConversationId) {
      setConversationId(undefined);
      setMessages([]);
      setLoadingConversation(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoadingConversation(true);
    setError(null);

    void (async () => {
      try {
        const conversation = await api.modules.ai.getConversation(
          paramConversationId,
        );
        if (cancelled) {
          return;
        }
        setConversationId(conversation.id);
        setMessages(toChatMessages(conversation.messages));
        pinToBottom.current = true;
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        setConversationId(undefined);
        setMessages([]);
        setError(
          getErrorMessage(
            loadError,
            "Não foi possível carregar esta conversa.",
          ),
        );
      } finally {
        if (!cancelled) {
          setLoadingConversation(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [api.modules.ai, paramConversationId]);

  useEffect(() => {
    if (loadingConversation) {
      pinToBottom.current = true;
      return;
    }
    scrollToEnd(false);
  }, [loadingConversation, conversationId, messages.length, scrollToEnd]);

  function closeBearCashIa() {
    if (closing) {
      return;
    }
    setClosing(true);
  }

  const finishClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (router.canDismiss()) {
      router.dismissTo("/(tabs)");
      return;
    }
    router.replace("/(tabs)");
  }, [router]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (historyOpen) {
          setHistoryOpen(false);
          return true;
        }
        closeBearCashIa();
        return true;
      },
    );
    return () => subscription.remove();
  }, [historyOpen, closing]);

  function startNewChat() {
    if (!conversationId && messages.length === 0 && !sending) {
      return;
    }

    setDraft("");
    setError(null);
    setConversationId(undefined);
    setMessages([]);
    pinToBottom.current = true;

    if (paramConversationId) {
      skipNextLoad.current = true;
      router.setParams({ conversationId: undefined });
    }
  }

  async function sendText(raw: string) {
    const text = raw.trim();
    if (!text || sending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: nextId(),
      role: "user",
      kind: "text",
      text,
    };

    setDraft("");
    setError(null);
    setSending(true);
    pinToBottom.current = true;
    setMessages((current) => [...current, userMessage]);
    scrollToEnd();

    try {
      const response = await api.modules.ai.chat({
        conversationId,
        message: text,
      });

      const assistantMessage: ChatMessage = {
        id: response.message.id,
        role: "bear-cash",
        kind: "text",
        text: response.message.content,
      };

      setMessages((current) => [...current, assistantMessage]);
      setConversationId(response.conversationId);

      if (!conversationId) {
        skipNextLoad.current = true;
        router.setParams({ conversationId: response.conversationId });
      }
      scrollToEnd();
    } catch (sendError) {
      setMessages((current) =>
        current.filter((item) => item.id !== userMessage.id),
      );
      setDraft(text);
      setError(
        getErrorMessage(sendError, "Não foi possível falar com o BearCash IA."),
      );
    } finally {
      setSending(false);
    }
  }

  const monthLabel = useMemo(() => currentMonthLabel(), []);
  const canSend = draft.trim().length > 0 && !sending && !loadingConversation;
  const showEmptyState =
    !loadingConversation && messages.length === 0 && !sending;
  const showSuggestions = showEmptyState && !conversationId;

  return (
    <BearCashIaScreenTransition closing={closing} onClosed={finishClose}>
      <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={closeBearCashIa}
            style={({ pressed }) => [
              styles.circleButton,
              pressed && styles.pressed,
            ]}
          >
            <BearCashIaCloseIcon size={20} color={BearCashColors.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Conversas anteriores"
            onPress={() => setHistoryOpen(true)}
            style={({ pressed }) => [
              styles.circleButton,
              pressed && styles.pressed,
            ]}
          >
            <BearCashIaClockIcon size={20} color={BearCashColors.text} />
          </Pressable>
        </View>

        {loadingConversation ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={BearCashColors.primarySoft} />
          </View>
        ) : showEmptyState ? (
          <View style={styles.hero}>
            <BearCashMascotIcon size={52} color={BearCashColors.text} />
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>{greeting}</Text>
              <Text style={styles.heroSubtitle}>Como posso te ajudar?</Text>
            </View>
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.chatContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={handleContentSizeChange}
            onScroll={handleScroll}
            scrollEventThrottle={16}
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
                <View key={message.id} style={styles.assistantBlock}>
                  <MarkdownMessage content={message.text ?? ""} />
                </View>
              );
            })}

            {sending ? (
              <View
                style={styles.assistantBlock}
                accessibilityLabel="BearCash está digitando"
              >
                <TypingDots />
              </View>
            ) : null}
          </ScrollView>
        )}

        {showSuggestions ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.suggestionsContent}
            style={styles.suggestions}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Seja Premium"
              onPress={() => router.push("/subscription-premium")}
              style={({ pressed }) => [
                styles.suggestionPill,
                pressed && styles.pressed,
              ]}
            >
              <SettingsRocketIcon size={14} color={BearCashColors.text} />
              <Text style={styles.suggestionText}>Seja Premium</Text>
            </Pressable>
            {SUGGESTIONS.map((label) => (
              <Pressable
                key={label}
                accessibilityRole="button"
                onPress={() => {
                  void sendText(label);
                }}
                style={({ pressed }) => [
                  styles.suggestionPill,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.suggestionText}>{label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Composer
            value={draft}
            onChangeText={setDraft}
            onSend={() => {
              void sendText(draft);
            }}
            onNewChat={startNewChat}
            canSend={canSend}
            sending={sending}
          />
        </View>
      </KeyboardAvoidingView>

      <BearCashIaHistorySheet
        visible={historyOpen}
        activeConversationId={conversationId}
        onClose={() => setHistoryOpen(false)}
        onSelect={(id) => {
          setHistoryOpen(false);
          if (id === conversationId) {
            return;
          }
          router.setParams({ conversationId: id });
        }}
        onNewChat={() => {
          setHistoryOpen(false);
          startNewChat();
        }}
      />
      </View>
    </BearCashIaScreenTransition>
  );
}

function TypingDots() {
  const styles = useStyles();
  const opacities = useRef([
    new Animated.Value(0.25),
    new Animated.Value(0.25),
    new Animated.Value(0.25),
  ]).current;

  useEffect(() => {
    const loops = opacities.map((opacity, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 160),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.25,
            duration: 280,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    loops.forEach((loop) => loop.start());
    return () => {
      loops.forEach((loop) => loop.stop());
      opacities.forEach((opacity) => opacity.setValue(0.25));
    };
  }, [opacities]);

  return (
    <View style={styles.typingDots}>
      {opacities.map((opacity, index) => (
        <Animated.View
          key={index}
          style={[styles.typingDot, { opacity }]}
        />
      ))}
    </View>
  );
}

function Composer({
  value,
  onChangeText,
  onSend,
  onNewChat,
  canSend,
  sending,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onNewChat: () => void;
  canSend: boolean;
  sending: boolean;
}) {
  const styles = useStyles();
  return (
    <View style={styles.composerRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nova conversa"
        onPress={onNewChat}
        style={({ pressed }) => [
          styles.plusButton,
          pressed && styles.pressed,
        ]}
      >
        <BearCashIaPlusIcon size={16} color={BearCashColors.text} />
      </Pressable>
      <View style={styles.inputPill}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder="Envie uma mensagem"
          placeholderTextColor={BearCashColors.textSoft}
          onSubmitEditing={onSend}
          returnKeyType="send"
          editable={!sending}
          accessibilityLabel="Mensagem para o BearCash IA"
        />
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
          {sending ? (
            <ActivityIndicator color={BearCashColors.onText} size="small" />
          ) : (
            <BearCashIaSendIcon size={14} color={BearCashColors.onText} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

function InsightBlock({ monthLabel }: { monthLabel: string }) {
  const styles = useStyles();
  return (
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
        Dica do BearCash: Você economizou bastante evitando deliveries à noite.
        Continue assim para atingir sua meta!
      </Text>
    </View>
  );
}

const useStyles = createThemedStyles(() => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BearCashColors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  circleButton: {
    width: CIRCLE_BUTTON,
    height: CIRCLE_BUTTON,
    borderRadius: CIRCLE_BUTTON / 2,
    borderWidth: 1,
    borderColor: BearCashColors.highlightStroke,
    backgroundColor: BearCashColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.82,
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  heroCopy: {
    alignItems: "center",
    gap: 6,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: BearCashFonts.semiBold,
    color: BearCashColors.text,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: BearCashFonts.regular,
    color: BearCashColors.textSoft,
    textAlign: "center",
  },
  chatContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 18,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.error,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  assistantBlock: {
    alignSelf: "stretch",
    paddingRight: 28,
  },
  bubbleText: {
    ...BearCashTypography.body,
    color: BearCashColors.text,
  },
  suggestions: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 10,
  },
  suggestionsContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  suggestionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: BearCashColors.surface,
    borderWidth: 1,
    borderColor: BearCashColors.highlightStroke,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionText: {
    ...BearCashTypography.subheading,
    color: BearCashColors.text,
  },
  userBlock: {
    alignItems: "flex-end",
  },
  userBubble: {
    maxWidth: "82%",
    backgroundColor: BearCashColors.neutralBase,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  insightBubble: {
    backgroundColor: BearCashColors.surface,
    borderWidth: 1,
    borderColor: BearCashColors.highlightStroke,
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  insightHero: {
    gap: 4,
  },
  insightKicker: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.textSoft,
  },
  insightAmount: {
    ...BearCashTypography.h1,
    color: BearCashColors.primarySoft,
  },
  insightDeltaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  insightDelta: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.income,
  },
  insightDeltaRest: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.textSoft,
  },
  insightDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BearCashColors.borderSoft,
  },
  insightSectionTitle: {
    ...BearCashTypography.caption,
    fontFamily: BearCashFonts.semiBold,
    color: BearCashColors.textMid,
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
    ...BearCashTypography.caption,
    color: BearCashColors.text,
  },
  categoryValue: {
    ...BearCashTypography.caption,
    color: BearCashColors.text,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: BearCashColors.borderSoft,
  },
  trackFill: {
    height: 6,
    borderRadius: 3,
  },
  insightTip: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: BearCashColors.textMid,
  },
  footer: {
    backgroundColor: BearCashColors.background,
    paddingTop: 4,
    paddingHorizontal: 16,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: COMPOSER_GAP,
  },
  plusButton: {
    width: CIRCLE_BUTTON,
    height: CIRCLE_BUTTON,
    borderRadius: CIRCLE_BUTTON / 2,
    borderWidth: 1,
    borderColor: BearCashColors.highlightStroke,
    backgroundColor: BearCashColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  inputPill: {
    flex: 1,
    minWidth: 0,
    minHeight: CIRCLE_BUTTON,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: BearCashColors.neutralBase,
    borderRadius: 999,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    ...BearCashTypography.body,
    color: BearCashColors.text,
  },
  sendButton: {
    width: SEND_SIZE,
    height: SEND_SIZE,
    borderRadius: 999,
    backgroundColor: BearCashColors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: {
    opacity: 0.28,
  },
}));
