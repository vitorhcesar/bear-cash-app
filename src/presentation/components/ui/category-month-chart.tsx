import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { BearCashColors, BearCashTypography } from "@/presentation/constants/theme";

const MONTH_LABELS = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
] as const;

const BAR_WIDTH = 28;
const BAR_GAP = 20;
const MAX_BAR = 120;
const EMPTY_SIZE = 14;
const THUMB_WIDTH = 39;
const SCROLLBAR_COLOR = "#8f4cd2";

export function CategoryMonthChart({
  values,
  selectedMonth,
  accentColor,
  onSelectMonth,
}: {
  values: number[];
  selectedMonth: number;
  accentColor: string;
  onSelectMonth: (month: number) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [offsetX, setOffsetX] = useState(0);

  const peak = Math.max(...values, 0);

  useEffect(() => {
    const x = Math.max(0, selectedMonth * (BAR_WIDTH + BAR_GAP) - BAR_WIDTH);
    scrollRef.current?.scrollTo({ x, animated: false });
  }, [selectedMonth]);

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setOffsetX(event.nativeEvent.contentOffset.x);
  }

  const overflow = Math.max(contentWidth - trackWidth, 0);
  const thumbTravel = Math.max(trackWidth - THUMB_WIDTH, 0);
  const thumbLeft = overflow > 0 ? (offsetX / overflow) * thumbTravel : 0;

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        nestedScrollEnabled
        onScroll={onScroll}
        scrollEventThrottle={16}
        onContentSizeChange={(width) => setContentWidth(width)}
      >
        {MONTH_LABELS.map((label, month) => {
          const amount = values[month] ?? 0;
          const selected = month === selectedMonth;
          const filled = amount > 0 && peak > 0;
          const height = filled
            ? Math.max(EMPTY_SIZE, (amount / peak) * MAX_BAR)
            : EMPTY_SIZE;

          return (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${label}${selected ? ", mês selecionado" : ""}`}
              onPress={() => onSelectMonth(month)}
              style={styles.col}
            >
              <View style={styles.barSlot}>
                <View
                  style={[
                    filled ? styles.bar : styles.empty,
                    {
                      height,
                      backgroundColor: filled
                        ? selected
                          ? accentColor
                          : BearCashColors.borderStrong
                        : "transparent",
                      borderColor: selected
                        ? accentColor
                        : BearCashColors.borderStrong,
                    },
                  ]}
                />
              </View>
              <Text style={styles.label} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View
        style={styles.track}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      >
        <View style={[styles.thumb, { left: thumbLeft }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "stretch",
    gap: 12,
    paddingTop: 30,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: BAR_GAP,
    minHeight: MAX_BAR + 21,
  },
  col: {
    width: BAR_WIDTH,
    alignItems: "center",
    gap: 2,
  },
  barSlot: {
    height: MAX_BAR,
    width: BAR_WIDTH,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: 40,
  },
  empty: {
    width: EMPTY_SIZE,
    height: EMPTY_SIZE,
    borderRadius: 40,
    borderWidth: 1,
  },
  label: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
    textAlign: "center",
    width: BAR_WIDTH,
  },
  track: {
    alignSelf: "stretch",
    height: 4,
    borderRadius: 16,
    backgroundColor: BearCashColors.surface,
    overflow: "hidden",
  },
  thumb: {
    position: "absolute",
    top: 0,
    width: THUMB_WIDTH,
    height: 4,
    borderRadius: 4,
    backgroundColor: SCROLLBAR_COLOR,
  },
});
