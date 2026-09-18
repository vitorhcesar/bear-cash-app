import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
  getBearCashScheme,
} from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";

export type CreditCardBillMonthPoint = {
  key: string;
  label: string;
  amount: number;
  hasData: boolean;
};

const BAR_MAX = 120;
const BAR_MIN = 36;
const EMPTY_SIZE = 14;
const THUMB_MIN = 39;

export function CreditCardBillsChart({
  points,
  selectedKey,
  onSelect,
  loading = false,
}: {
  points: CreditCardBillMonthPoint[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  loading?: boolean;
}) {
  const styles = useStyles();
  const selectedFill =
    getBearCashScheme() === "dark" ? "#A670DB" : BearCashColors.iconAccent;
  const [trackWidth, setTrackWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const peak = Math.max(0, ...points.map((point) => point.amount));

  function barHeight(point: CreditCardBillMonthPoint) {
    if (!point.hasData) {
      return EMPTY_SIZE;
    }
    if (peak <= 0) {
      return BAR_MIN;
    }
    return BAR_MIN + (point.amount / peak) * (BAR_MAX - BAR_MIN);
  }

  const overflow = Math.max(contentWidth - trackWidth, 0);
  const thumbWidth =
    trackWidth > 0 && contentWidth > 0
      ? Math.min(
          trackWidth,
          Math.max(THUMB_MIN, (trackWidth / Math.max(contentWidth, 1)) * trackWidth),
        )
      : THUMB_MIN;
  const thumbTravel = Math.max(trackWidth - thumbWidth, 0);
  const thumbLeft = overflow > 0 ? (offsetX / overflow) * thumbTravel : thumbTravel;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Faturas</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={styles.dotAvailable} />
            <Text style={styles.legendLabel}>Dados disponíveis</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dotSelected, { backgroundColor: selectedFill }]} />
            <Text style={styles.legendLabel}>Selecionado</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.dotEmpty} />
            <Text style={styles.legendLabel}>Sem dados</Text>
          </View>
        </View>
      </View>

      <View
        style={styles.body}
        onLayout={(event) => {
          const next = event.nativeEvent.layout.width;
          if (next !== trackWidth) {
            setTrackWidth(next);
          }
        }}
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={BearCashColors.primary} />
          </View>
        ) : (
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bars}
            onContentSizeChange={(width) => {
              if (width !== contentWidth) {
                setContentWidth(width);
              }
            }}
            onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
              setOffsetX(event.nativeEvent.contentOffset.x);
            }}
            scrollEventThrottle={16}
          >
            {points.map((point) => {
              const selected = point.key === selectedKey;
              const height = barHeight(point);
              return (
                <Pressable
                  key={point.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Fatura de ${point.label}${
                    selected ? ", selecionado" : ""
                  }`}
                  onPress={() => onSelect(point.key)}
                  style={styles.barCol}
                >
                  {point.hasData ? (
                    <View
                      style={[
                        styles.bar,
                        {
                          height,
                          backgroundColor: selected
                            ? selectedFill
                            : BearCashColors.borderStrong,
                        },
                      ]}
                    />
                  ) : (
                    <View style={styles.emptyMark} />
                  )}
                  <Text style={styles.barLabel} numberOfLines={1}>
                    {point.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      <View style={styles.scrollTrack}>
        <View
          style={[
            styles.scrollThumb,
            { width: thumbWidth, transform: [{ translateX: thumbLeft }] },
          ]}
        />
      </View>
    </View>
  );
}

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
    root: {
      alignSelf: "stretch",
      borderWidth: 1,
      borderColor: BearCashColors.borderStrong,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: BearCashColors.background,
    },
    header: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 4,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: BearCashColors.borderStrong,
    },
    title: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 12,
      lineHeight: 19,
      color: BearCashColors.text,
    },
    legend: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    legendLabel: {
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textSoft,
    },
    dotAvailable: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: BearCashColors.borderStrong,
    },
    dotSelected: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    dotEmpty: {
      width: 6,
      height: 6,
      borderRadius: 3,
      borderWidth: 1,
      borderColor: BearCashColors.borderStrong,
    },
    body: {
      height: 180,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
      justifyContent: "flex-end",
    },
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    bars: {
      flexGrow: 1,
      minWidth: "100%",
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 8,
    },
    barCol: {
      width: 28,
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 6,
    },
    bar: {
      alignSelf: "stretch",
      borderRadius: 40,
    },
    emptyMark: {
      width: EMPTY_SIZE,
      height: EMPTY_SIZE,
      borderRadius: EMPTY_SIZE / 2,
      borderWidth: 1,
      borderColor: BearCashColors.borderStrong,
    },
    barLabel: {
      width: "100%",
      fontFamily: BearCashFonts.regular,
      fontSize: 12,
      lineHeight: 19,
      textAlign: "center",
      color: BearCashColors.textSoft,
    },
    scrollTrack: {
      height: 4,
      marginHorizontal: 12,
      marginTop: 8,
      marginBottom: 12,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: BearCashColors.surface,
    },
    scrollThumb: {
      height: 4,
      borderRadius: 4,
      backgroundColor: BearCashColors.textSoft,
    },
  }),
);
