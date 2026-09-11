import { Image, type ImageSource } from 'expo-image';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/presentation/components/ui/back-button';
import { Button } from '@/presentation/components/ui/button';
import { HighlightCardBorder } from '@/presentation/components/ui/highlight-card-border';
import {
  FeatureCheckIcon,
  HintInfoIcon,
  PlanRadioIcon,
  ReviewStarIcon,
} from '@/presentation/components/ui/subscription-icons';
import { BearCashColors, BearCashFonts, BearCashTypography } from '@/presentation/constants/theme';

const HERO_HEIGHT = 209;
const REVIEW_CARD_WIDTH = 250;

export type SubscriptionPlanId = 'yearly' | 'monthly';

export type SubscriptionPlanOption = {
  title: string;
  description: string;
  price: string;
  strikethrough?: string;
  badge: string;
  badgeColor: string;
};

export type SubscriptionReview = {
  id: string;
  title: string;
  body: string;
  author: string;
  place: string;
};

export type SubscriptionOfferContent = {
  hero: ImageSource;
  heroLabel: string;
  title: string;
  titleColor: string;
  subtitle: string;
  accent: string;
  ctaLabel: string;
  ctaColor: string;
  yearly: SubscriptionPlanOption;
  monthly: SubscriptionPlanOption;
  features: readonly string[];
  reviews: readonly SubscriptionReview[];
};

type PlanCardProps = SubscriptionPlanOption & {
  selected: boolean;
  accent: string;
  onPress: () => void;
};

function PlanCard({
  title,
  description,
  price,
  strikethrough,
  badge,
  badgeColor,
  selected,
  accent,
  onPress,
}: PlanCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        selected ? styles.planCardSelectedOuter : styles.planCardIdleOuter,
        pressed && styles.pressed,
      ]}
    >
      {selected ? <HighlightCardBorder /> : null}
      <View style={[styles.planCardRow, selected && styles.planCardSelectedInner]}>
        <View style={styles.planCardMain}>
          <PlanRadioIcon selected={selected} selectedColor={accent} />
          <View style={styles.planCardCopy}>
            <View style={styles.planCardTitleRow}>
              <Text style={styles.planCardTitle}>{title}</Text>
              <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            </View>
            <Text style={styles.planCardDescription}>{description}</Text>
          </View>
        </View>

        <View style={styles.planCardPrice}>
          {strikethrough ? (
            <Text
              style={[
                styles.planCardStrike,
                selected && styles.planCardMetaSelected,
              ]}
            >
              {strikethrough}
            </Text>
          ) : null}
          <View style={styles.planCardAmountRow}>
            <Text style={styles.planCardCurrency}>R$</Text>
            <Text style={styles.planCardAmount}>{price}</Text>
          </View>
          <Text
            style={[
              styles.planCardPeriod,
              selected && styles.planCardMetaSelected,
            ]}
          >
            Por mês
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function ReviewCard({
  title,
  body,
  author,
  place,
  fullWidth,
}: SubscriptionReview & { fullWidth?: boolean }) {
  return (
    <View style={[styles.reviewCard, fullWidth && styles.reviewCardFull]}>
      <View style={styles.stars}>
        {Array.from({ length: 5 }).map((_, index) => (
          <ReviewStarIcon key={index} size={12} />
        ))}
      </View>
      <View style={styles.reviewCopy}>
        <Text style={styles.reviewTitle}>{title}</Text>
        <Text style={styles.reviewBody}>{body}</Text>
      </View>
      <View style={styles.reviewAuthorRow}>
        <Text style={styles.reviewMeta}>{author}</Text>
        <View style={styles.reviewDot} />
        <Text style={styles.reviewMeta}>{place}</Text>
      </View>
    </View>
  );
}

function comingSoon(title: string) {
  Alert.alert(title, 'Em breve.');
}

export function SubscriptionOfferScreen({
  content,
}: {
  content: SubscriptionOfferContent;
}) {
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState<SubscriptionPlanId>('yearly');
  const singleReview = content.reviews.length === 1;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 24 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { height: HERO_HEIGHT + insets.top }]}>
          <Image
            source={content.hero}
            style={styles.heroImage}
            contentFit="cover"
            accessibilityLabel={content.heroLabel}
          />
          <View style={styles.heroFade} pointerEvents="none" />
          <BackButton
            fallbackHref="/subscription"
            color={BearCashColors.background}
            size={24}
            style={[styles.heroBack, { top: insets.top + 16 }]}
          />
        </View>

        <View style={styles.body}>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: content.titleColor }]}>
              {content.title}
            </Text>
            <Text style={styles.subtitle}>{content.subtitle}</Text>
          </View>

          <PlanCard
            {...content.yearly}
            selected={plan === 'yearly'}
            accent={content.accent}
            onPress={() => setPlan('yearly')}
          />

          <PlanCard
            {...content.monthly}
            selected={plan === 'monthly'}
            accent={content.accent}
            onPress={() => setPlan('monthly')}
          />

          <View style={styles.features}>
            {content.features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <FeatureCheckIcon size={16} color={content.accent} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {content.reviews.length > 0 ? (
            <View style={styles.reviewsSection}>
              <Text style={styles.reviewsHeading}>
                Mais de 6.000 clientes confiam no nosso trabalho
              </Text>
              {singleReview && content.reviews[0] ? (
                <ReviewCard {...content.reviews[0]} fullWidth />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.reviewsList}
                  style={styles.reviewsScroller}
                >
                  {content.reviews.map((review) => (
                    <ReviewCard key={review.id} {...review} />
                  ))}
                </ScrollView>
              )}
            </View>
          ) : null}

          <View style={styles.hintRow}>
            <HintInfoIcon size={16} />
            <Text style={styles.hintText}>Cancele quando quiser</Text>
          </View>

          <Button
            label={content.ctaLabel}
            variant="filled"
            style={{ backgroundColor: content.ctaColor }}
            onPress={() => comingSoon(content.ctaLabel)}
          />

          <View style={styles.footerLinks}>
            <Pressable
              accessibilityRole="button"
              onPress={() => comingSoon('Termos de uso')}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.footerLink}>Termos de uso</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => comingSoon('Restaurar plano')}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.footerLink}>Restaurar plano</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BearCashColors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    width: '100%',
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    backgroundColor: 'transparent',
    experimental_backgroundImage:
      'linear-gradient(183deg, rgba(10, 11, 10, 0) 0%, rgba(10, 11, 10, 0.29) 18%, rgba(10, 11, 10, 0.49) 32%, rgba(10, 11, 10, 0.78) 58%, rgb(10, 11, 10) 82%)',
  },
  heroBack: {
    position: 'absolute',
    left: 16,
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: BearCashColors.buttonFilledDisabled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 16,
    gap: 24,
    alignItems: 'center',
  },
  headerCopy: {
    alignSelf: 'stretch',
    gap: 8,
  },
  title: {
    ...BearCashTypography.h1,
  },
  subtitle: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  planCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    borderRadius: 12,
  },
  planCardSelectedOuter: {
    alignSelf: 'stretch',
    borderRadius: 12,
    padding: 1,
    overflow: 'hidden',
  },
  planCardSelectedInner: {
    backgroundColor: BearCashColors.surface,
  },
  planCardIdleOuter: {
    alignSelf: 'stretch',
    borderRadius: 12,
    backgroundColor: BearCashColors.background,
    shadowColor: '#0A0D14',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  planCardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  planCardCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  planCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  planCardTitle: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 16,
    lineHeight: 26,
    color: BearCashColors.text,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.background,
  },
  planCardDescription: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textSoft,
  },
  planCardPrice: {
    alignItems: 'flex-end',
    gap: 2,
  },
  planCardStrike: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.textSoft,
    textDecorationLine: 'line-through',
  },
  planCardAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  planCardCurrency: {
    ...BearCashTypography.caption,
    color: BearCashColors.text,
  },
  planCardAmount: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.text,
  },
  planCardPeriod: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.textSoft,
  },
  planCardMetaSelected: {
    color: '#c7c5c9',
  },
  features: {
    alignSelf: 'stretch',
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.text,
    flex: 1,
  },
  reviewsSection: {
    alignSelf: 'stretch',
    gap: 16,
  },
  reviewsHeading: {
    ...BearCashTypography.h3,
    color: BearCashColors.text,
  },
  reviewsScroller: {
    marginHorizontal: -16,
  },
  reviewsList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  reviewCard: {
    width: REVIEW_CARD_WIDTH,
    backgroundColor: BearCashColors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  reviewCardFull: {
    width: '100%',
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewCopy: {
    gap: 2,
  },
  reviewTitle: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 14,
    lineHeight: 22,
    color: BearCashColors.text,
  },
  reviewBody: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textSoft,
  },
  reviewAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewMeta: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.textSoft,
  },
  reviewDot: {
    width: 2,
    height: 2,
    borderRadius: 999,
    backgroundColor: BearCashColors.textSoft,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hintText: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  footerLink: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  pressed: {
    opacity: 0.85,
  },
});
