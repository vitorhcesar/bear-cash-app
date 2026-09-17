import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { MONTHS_LONG } from "@/presentation/components/ui/calendar";
import { getCurrencySymbol } from "@/presentation/components/ui/currencies";
import {
  HomeDashInflowIcon,
  HomeDashOutflowIcon,
} from "@/presentation/components/ui/home-icons";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";

export type CashFlowChartPoint = {
  key: string;
  label: string;
  date: Date;
  inflow: number;
  outflow: number;
};

const STEP = 25;
const MONTH_STEP = 48;
const BODY_HEIGHT = 160;
const LABEL_HEIGHT = 16;
const PLOT_HEIGHT = BODY_HEIGHT - LABEL_HEIGHT - 4;
const PLOT_PAD = 8;
const PLOT_BASELINE = PLOT_HEIGHT - PLOT_PAD;
const LINE_GROW_MS = 820;

const AnimatedPath = Animated.createAnimatedComponent(Path);

type PlotPoint = { x: number; y: number };
const THUMB_WIDTH = 39;
const DOT_SIZE = 10;
const TOOLTIP_ESTIMATE = 96;

function formatTooltipAmount(amount: number) {
  const whole = Number.isInteger(amount);
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function tooltipDateLabel(date: Date, axis: "day" | "month") {
  if (axis === "month") {
    return `${MONTHS_LONG[date.getMonth()]} de ${date.getFullYear()}`;
  }
  return `${date.getDate()} de ${MONTHS_LONG[date.getMonth()]}`;
}

function linePath(points: PlotPoint[]) {
  "worklet";
  if (points.length === 0) {
    return "";
  }
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];
    const mid = (from.x + to.x) / 2;
    d += ` C ${mid} ${from.y}, ${mid} ${to.y}, ${to.x} ${to.y}`;
  }
  return d;
}

function grownPoints(points: PlotPoint[], progress: number) {
  "worklet";
  return points.map((point) => ({
    x: point.x,
    y: PLOT_BASELINE + (point.y - PLOT_BASELINE) * progress,
  }));
}

function plotY(value: number, peak: number) {
  if (peak <= 0) {
    return PLOT_BASELINE;
  }
  const usable = PLOT_HEIGHT - PLOT_PAD * 2;
  return PLOT_PAD + (1 - value / peak) * usable;
}

export function CashFlowChart({
  points,
  selectedKey,
  showInflow,
  showOutflow,
  onSelect,
  loading = false,
  title = "Análise Mensal",
  axis = "day",
  inset = "default",
  layout = "scroll",
}: {
  points: CashFlowChartPoint[];
  selectedKey: string | null;
  showInflow: boolean;
  showOutflow: boolean;
  onSelect: (key: string) => void;
  loading?: boolean;
  title?: string;
  axis?: "day" | "month";
  inset?: "default" | "wide";
  layout?: "fit" | "scroll";
}) {
  const styles = useStyles();
  const scrollRef = useRef<ScrollView>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const grow = useSharedValue(0);
  const inflowSV = useSharedValue<PlotPoint[]>([]);
  const outflowSV = useSharedValue<PlotPoint[]>([]);
  const selectedYSV = useSharedValue(0);
  const selectedIndex = points.findIndex((point) => point.key === selectedKey);
  const peak = Math.max(
    0,
    ...points.map((point) =>
      Math.max(showInflow ? point.inflow : 0, showOutflow ? point.outflow : 0),
    ),
  );
  const spread = layout === "fit";
  const step = !spread && axis === "month" ? MONTH_STEP : STEP;
  const count = Math.max(points.length, 1);
  const colWidth = spread && trackWidth > 0 ? trackWidth / count : step;
  const plotWidth = spread
    ? Math.max(trackWidth, 0)
    : Math.max(points.length * step, trackWidth);
  const pointX = (index: number) => index * colWidth + colWidth / 2;
  const selected = selectedIndex >= 0 ? points[selectedIndex] : null;
  const selectedX = selectedIndex >= 0 ? pointX(selectedIndex) : 0;
  const selectedY = selected
    ? plotY(
        showInflow && showOutflow
          ? selected.inflow
          : showOutflow
            ? selected.outflow
            : selected.inflow,
        peak,
      )
    : 0;
  const tooltipLeft = Math.min(
    Math.max(selectedX - TOOLTIP_ESTIMATE / 2, 4),
    Math.max(plotWidth - TOOLTIP_ESTIMATE - 4, 4),
  );
  const seriesKey = `${showInflow ? 1 : 0}${showOutflow ? 1 : 0}:${Math.round(colWidth * 100)}:${points
    .map((point) => `${point.key}:${point.inflow}:${point.outflow}`)
    .join(",")}`;

  useLayoutEffect(() => {
    selectedYSV.value = selectedY;
  }, [selectedY, selectedYSV]);

  useLayoutEffect(() => {
    grow.value = 0;
    if (loading || trackWidth <= 0 || points.length === 0) {
      return;
    }
    inflowSV.value = points.map((point, index) => ({
      x: pointX(index),
      y: plotY(point.inflow, peak),
    }));
    outflowSV.value = points.map((point, index) => ({
      x: pointX(index),
      y: plotY(point.outflow, peak),
    }));
    grow.value = withTiming(1, {
      duration: LINE_GROW_MS,
      easing: Easing.bezier(0.2, 0.82, 0.22, 1),
      reduceMotion: ReduceMotion.System,
    });
  }, [grow, inflowSV, loading, outflowSV, seriesKey, trackWidth]);

  const inflowProps = useAnimatedProps(() => ({
    d: linePath(grownPoints(inflowSV.value, grow.value)),
    opacity: grow.value,
  }));
  const outflowProps = useAnimatedProps(() => ({
    d: linePath(grownPoints(outflowSV.value, grow.value)),
    opacity: grow.value,
  }));
  const selectedDotStyle = useAnimatedStyle(() => ({
    opacity: grow.value,
    top:
      PLOT_BASELINE +
      (selectedYSV.value - PLOT_BASELINE) * grow.value -
      DOT_SIZE / 2,
  }));
  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: grow.value,
    top: Math.max(
      PLOT_BASELINE +
        (selectedYSV.value - PLOT_BASELINE) * grow.value -
        78,
      0,
    ),
  }));

  useEffect(() => {
    if (spread || selectedIndex < 0) {
      return;
    }
    const x = Math.max(0, selectedIndex * step - trackWidth / 2 + step / 2);
    scrollRef.current?.scrollTo({ x, animated: true });
  }, [selectedIndex, spread, step, trackWidth]);

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setOffsetX(event.nativeEvent.contentOffset.x);
  }

  const overflow = Math.max(contentWidth - trackWidth, 0);
  const thumbTravel = Math.max(trackWidth - THUMB_WIDTH, 0);
  const thumbLeft = overflow > 0 ? (offsetX / overflow) * thumbTravel : 0;

  const plot = (
    <View
      style={{
        width: spread ? "100%" : plotWidth,
        height: BODY_HEIGHT,
      }}
    >
      {trackWidth > 0 && !loading ? (
        <Svg
          pointerEvents="none"
          width={plotWidth}
          height={PLOT_HEIGHT}
          style={styles.plot}
        >
          {showInflow ? (
            <AnimatedPath
              d=""
              opacity={0}
              animatedProps={inflowProps}
              stroke={BearCashColors.income}
              strokeWidth={1.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {showOutflow ? (
            <AnimatedPath
              d=""
              opacity={0}
              animatedProps={outflowProps}
              stroke={BearCashColors.expense}
              strokeWidth={1.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </Svg>
      ) : null}
      <View style={[styles.cols, spread && styles.colsSpread]}>
        {points.map((point) => {
          const active = point.key === selectedKey;
          return (
            <Pressable
              key={point.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${point.label}${active ? ", selecionado" : ""}`}
              onPress={() => onSelect(point.key)}
              style={[
                styles.col,
                spread
                  ? styles.colSpread
                  : axis === "month"
                    ? styles.colMonth
                    : styles.colDay,
              ]}
            >
              <View
                style={[
                  styles.guide,
                  active && styles.guideActive,
                  { height: PLOT_HEIGHT },
                ]}
              />
              <Text
                style={[styles.colLabel, active && styles.colLabelActive]}
              >
                {point.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {selected && !loading ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.selectedDot,
              { left: selectedX - DOT_SIZE / 2 },
              selectedDotStyle,
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.tooltipWrap,
              { left: tooltipLeft },
              tooltipStyle,
            ]}
          >
            <View style={styles.tooltip}>
              <Text style={styles.tooltipDate}>
                {tooltipDateLabel(selected.date, axis)}
              </Text>
              {showInflow ? (
                <View style={styles.tooltipRow}>
                  <HomeDashInflowIcon size={12} />
                  <Text style={styles.tooltipCoin}>
                    {getCurrencySymbol("BRL")}
                  </Text>
                  <Text style={styles.tooltipValue}>
                    {formatTooltipAmount(selected.inflow)}
                  </Text>
                </View>
              ) : null}
              {showOutflow ? (
                <View style={styles.tooltipRow}>
                  <HomeDashOutflowIcon size={12} />
                  <Text style={styles.tooltipCoin}>
                    {getCurrencySymbol("BRL")}
                  </Text>
                  <Text style={styles.tooltipValue}>
                    {formatTooltipAmount(selected.outflow)}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.tooltipTail} />
          </Animated.View>
        </>
      ) : null}
    </View>
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.legend}>
          {showInflow ? (
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, styles.legendInflow]} />
              <Text style={styles.legendLabel}>Entrada</Text>
            </View>
          ) : null}
          {showOutflow ? (
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, styles.legendOutflow]} />
              <Text style={styles.legendLabel}>Saída</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={[styles.body, inset === "wide" && styles.bodySpread]}>
        <View
          style={styles.plotHost}
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            if (width !== trackWidth) {
              setTrackWidth(width);
            }
          }}
        >
          {points.length === 0 ? (
            <Text style={styles.empty}>Sem dados neste período</Text>
          ) : spread ? (
            plot
          ) : (
            <ScrollView
              ref={scrollRef}
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              onContentSizeChange={(width) => setContentWidth(width)}
            >
              {plot}
            </ScrollView>
          )}
        </View>
        {loading ? (
          <View pointerEvents="none" style={styles.loadingOverlay}>
            <ActivityIndicator
              size="large"
              color={BearCashColors.buttonFilled}
              accessibilityLabel="Carregando fluxo de caixa"
            />
          </View>
        ) : null}
      </View>

      <View style={styles.scrollTrack}>
        <View style={[styles.scrollThumb, { left: thumbLeft }]} />
      </View>
    </View>
  );
}

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
    card: {
      alignSelf: "stretch",
      borderWidth: 1,
      borderColor: BearCashColors.borderSoft,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: BearCashColors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: BearCashColors.borderSoft,
    },
    title: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 12,
      lineHeight: 19,
      color: BearCashColors.text,
    },
    legend: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    legendLine: {
      width: 8,
      height: 2,
      borderRadius: 1,
    },
    legendInflow: {
      backgroundColor: BearCashColors.income,
    },
    legendOutflow: {
      backgroundColor: BearCashColors.expense,
    },
    legendLabel: {
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textSoft,
    },
    body: {
      height: BODY_HEIGHT + 32,
      padding: 16,
      position: "relative",
    },
    bodySpread: {
      paddingHorizontal: 59,
      paddingVertical: 16,
    },
    plotHost: {
      height: BODY_HEIGHT,
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
      elevation: 10,
    },
    empty: {
      ...BearCashTypography.caption,
      color: BearCashColors.textSoft,
      textAlign: "center",
      paddingVertical: 48,
    },
    plot: {
      position: "absolute",
      top: 0,
      left: 0,
    },
    cols: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    colsSpread: {
      alignSelf: "stretch",
    },
    col: {
      alignItems: "center",
      gap: 4,
    },
    colDay: {
      width: STEP,
    },
    colMonth: {
      width: MONTH_STEP,
    },
    colSpread: {
      flex: 1,
      minWidth: 0,
    },
    guide: {
      width: 1,
      backgroundColor: BearCashColors.borderSoft,
    },
    guideActive: {
      backgroundColor: BearCashColors.text,
    },
    colLabel: {
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textSoft,
      textAlign: "center",
    },
    colLabelActive: {
      color: BearCashColors.text,
    },
    selectedDot: {
      position: "absolute",
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      backgroundColor: BearCashColors.text,
      borderWidth: 2,
      borderColor: BearCashColors.background,
    },
    tooltipWrap: {
      position: "absolute",
      width: TOOLTIP_ESTIMATE,
      alignItems: "center",
      gap: 2,
    },
    tooltip: {
      backgroundColor: BearCashColors.surface,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 4,
      alignItems: "center",
    },
    tooltipDate: {
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textSoft,
    },
    tooltipRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    tooltipCoin: {
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textMid,
    },
    tooltipValue: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 10,
      lineHeight: 16,
      color: BearCashColors.textMid,
    },
    tooltipTail: {
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: 6,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      borderTopColor: BearCashColors.surface,
    },
    scrollTrack: {
      alignSelf: "stretch",
      height: 4,
      marginHorizontal: 12,
      marginBottom: 12,
      borderRadius: 16,
      backgroundColor: BearCashColors.surface,
      overflow: "hidden",
    },
    scrollThumb: {
      position: "absolute",
      top: 0,
      width: THUMB_WIDTH,
      height: 4,
      borderRadius: 4,
      backgroundColor: BearCashColors.textSoft,
    },
  }),
);
