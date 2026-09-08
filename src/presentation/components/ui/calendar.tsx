import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  LinearTransition,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  authFadeIn,
  type AuthSlideDirection,
} from '@/presentation/auth/auth-switch-transition';
import {
  CalendarChevronDownIcon,
  CalendarChevronLeftIcon,
  CalendarChevronRightIcon,
} from '@/presentation/components/ui/calendar-icons';
import {
  OttoColors,
  OttoFonts,
  OttoTypography,
} from '@/presentation/constants/theme';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

const WEEKDAYS_LONG = [
  'Domingo',
  'Segunda-Feira',
  'Terça-Feira',
  'Quarta-Feira',
  'Quinta-Feira',
  'Sexta-Feira',
  'Sábado',
] as const;

const MONTHS_LONG = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

const MONTHS_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const;

export type CalendarMode = 'single' | 'range';

export type CalendarRange = {
  start: Date | null;
  end: Date | null;
};

export type CalendarProps = {
  mode?: CalendarMode;
  /** Selected day in `single` mode */
  value?: Date | null;
  /** Selected range in `range` mode */
  range?: CalendarRange;
  onSelectDate?: (date: Date) => void;
  onSelectRange?: (range: CalendarRange) => void;
  /** Visible month (defaults to selected date / today) */
  month?: Date;
  onMonthChange?: (month: Date) => void;
};

type CalendarDay = {
  date: Date;
  inMonth: boolean;
};

type RangeSlot = 'start' | 'end' | 'middle' | 'single' | null;

const SWITCH_EXIT_MS = 220;
const SWITCH_SLIDE = 18;
const SWITCH_EASING = Easing.out(Easing.cubic);

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isBeforeDay(left: Date, right: Date) {
  return startOfDay(left).getTime() < startOfDay(right).getTime();
}

function isWithinRange(date: Date, start: Date, end: Date) {
  const time = startOfDay(date).getTime();
  return time >= startOfDay(start).getTime() && time <= startOfDay(end).getTime();
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function formatLongDate(date: Date) {
  return `${date.getDate()} de ${MONTHS_LONG[date.getMonth()]} de ${date.getFullYear()}`;
}

export function formatTransactionDetailsDate(date: Date) {
  return `${WEEKDAYS_LONG[date.getDay()]}, ${formatLongDate(date)}`;
}

export function formatActivityDay(date: Date) {
  return `${date.getDate()} de ${MONTHS_SHORT[date.getMonth()]}`;
}

export function formatActivitySection(date: Date, today = new Date()) {
  const selected = startOfDay(date);
  const current = startOfDay(today);
  const yesterday = addDays(current, -1);

  if (selected.getTime() === current.getTime()) {
    return 'Hoje';
  }
  if (selected.getTime() === yesterday.getTime()) {
    return 'Ontem';
  }
  if (selected.getFullYear() === current.getFullYear()) {
    return `${selected.getDate()} de ${MONTHS_LONG[selected.getMonth()]}`;
  }
  return formatLongDate(selected);
}

function formatMonthYear(date: Date) {
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

function buildMonthDays(month: Date): CalendarDay[][] {
  const first = startOfMonth(month);
  const startOffset = first.getDay();
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);

  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const endOffset = 6 - last.getDay();
  const gridEnd = new Date(last);
  gridEnd.setDate(last.getDate() + endOffset);

  const rows: CalendarDay[][] = [];
  const cursor = new Date(gridStart);

  while (cursor.getTime() <= gridEnd.getTime()) {
    const row: CalendarDay[] = [];
    for (let index = 0; index < 7; index += 1) {
      const date = new Date(cursor);
      row.push({
        date,
        inMonth: date.getMonth() === month.getMonth(),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    rows.push(row);
  }

  return rows;
}

function getRangeSlot(
  date: Date,
  range: CalendarRange | undefined,
): RangeSlot {
  if (!range?.start || !range.end) {
    return null;
  }

  if (!isWithinRange(date, range.start, range.end)) {
    return null;
  }

  if (isSameDay(range.start, range.end)) {
    return 'single';
  }

  if (isSameDay(date, range.start)) {
    return 'start';
  }

  if (isSameDay(date, range.end)) {
    return 'end';
  }

  return 'middle';
}

export function Calendar({
  mode = 'single',
  value = null,
  range,
  onSelectDate,
  onSelectRange,
  month: monthProp,
  onMonthChange,
}: CalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [view, setView] = useState<'days' | 'months'>('days');
  const [paneReady, setPaneReady] = useState(false);
  const [slideFrom, setSlideFrom] = useState<AuthSlideDirection>('right');
  const [uncontrolledMonth, setUncontrolledMonth] = useState(() =>
    startOfMonth(value ?? range?.start ?? new Date()),
  );
  const exitTranslateX = useSharedValue(-SWITCH_SLIDE);

  const month = startOfMonth(monthProp ?? uncontrolledMonth);
  const weeks = useMemo(() => buildMonthDays(month), [month]);
  const paneKey =
    view === 'months'
      ? `months-${month.getFullYear()}`
      : `days-${month.getFullYear()}-${month.getMonth()}`;

  useEffect(() => {
    setPaneReady(true);
  }, []);

  function setMonth(next: Date) {
    const normalized = startOfMonth(next);
    if (!monthProp) {
      setUncontrolledMonth(normalized);
    }
    onMonthChange?.(normalized);
  }

  function animatePane(from: AuthSlideDirection) {
    exitTranslateX.value = from === 'right' ? -SWITCH_SLIDE : SWITCH_SLIDE;
    setSlideFrom(from);
  }

  function goToMonth(next: Date, from: AuthSlideDirection) {
    animatePane(from);
    setMonth(next);
  }

  function handleSelectDay(date: Date) {
    const selected = startOfDay(date);

    if (mode === 'single') {
      onSelectDate?.(selected);
      if (selected.getMonth() !== month.getMonth()) {
        animatePane(isBeforeDay(selected, month) ? 'left' : 'right');
        setMonth(selected);
      }
      return;
    }

    if (!range?.start || range.end) {
      onSelectRange?.({ start: selected, end: null });
      return;
    }

    if (isBeforeDay(selected, range.start)) {
      onSelectRange?.({ start: selected, end: range.start });
      return;
    }

    onSelectRange?.({ start: range.start, end: selected });
  }

  function handleSelectMonth(monthIndex: number) {
    animatePane('left');
    setMonth(new Date(month.getFullYear(), monthIndex, 1));
    setView('days');
  }

  function toggleView() {
    const openingMonths = view === 'days';
    animatePane(openingMonths ? 'right' : 'left');
    setView(openingMonths ? 'months' : 'days');
  }

  const headerLabel =
    view === 'months' ? String(month.getFullYear()) : formatMonthYear(month);

  const paneExiting = () => {
    'worklet';
    return {
      initialValues: {
        opacity: 1,
        transform: [{ translateX: 0 }],
      },
      animations: {
        opacity: withTiming(0, {
          duration: SWITCH_EXIT_MS,
          easing: SWITCH_EASING,
        }),
        transform: [
          {
            translateX: withTiming(exitTranslateX.value, {
              duration: SWITCH_EXIT_MS,
              easing: SWITCH_EASING,
            }),
          },
        ],
      },
    };
  };

  return (
    <Animated.View
      layout={LinearTransition.duration(280).easing(SWITCH_EASING)}
      style={styles.card}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={view === 'months' ? 'Ano anterior' : 'Mês anterior'}
          hitSlop={8}
          onPress={() =>
            view === 'months'
              ? goToMonth(
                  new Date(month.getFullYear() - 1, month.getMonth(), 1),
                  'left',
                )
              : goToMonth(addMonths(month, -1), 'left')
          }
        >
          <CalendarChevronLeftIcon size={24} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Escolher mês"
          onPress={toggleView}
          style={styles.monthButton}
        >
          <Animated.Text
            key={headerLabel}
            entering={paneReady ? authFadeIn(slideFrom) : undefined}
            exiting={FadeOut.duration(SWITCH_EXIT_MS).easing(SWITCH_EASING)}
            style={styles.monthLabel}
          >
            {headerLabel}
          </Animated.Text>
          <CalendarChevronDownIcon size={12} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={view === 'months' ? 'Próximo ano' : 'Próximo mês'}
          hitSlop={8}
          onPress={() =>
            view === 'months'
              ? goToMonth(
                  new Date(month.getFullYear() + 1, month.getMonth(), 1),
                  'right',
                )
              : goToMonth(addMonths(month, 1), 'right')
          }
        >
          <CalendarChevronRightIcon size={24} />
        </Pressable>
      </View>

      <View style={styles.paneClip}>
        <Animated.View
          key={paneKey}
          entering={paneReady ? authFadeIn(slideFrom) : undefined}
          exiting={paneExiting}
          style={styles.pane}
        >
          {view === 'months' ? (
            <View style={styles.monthGrid}>
              {MONTHS_SHORT.map((label, monthIndex) => {
                const selected = monthIndex === month.getMonth();
                return (
                  <Pressable
                    key={label}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => handleSelectMonth(monthIndex)}
                    style={styles.monthCell}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selected ? styles.dayTextEmphasis : styles.dayTextInMonth,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.grid}>
              <View style={styles.weekdayRow}>
                {WEEKDAYS.map((weekday) => (
                  <Text key={weekday} style={styles.weekday}>
                    {weekday}
                  </Text>
                ))}
              </View>

              {weeks.map((week) => (
                <View key={dateKey(week[0].date)} style={styles.weekRow}>
                  {week.map((day) => {
                    const selectedSingle =
                      mode === 'single' && value
                        ? isSameDay(day.date, value)
                        : false;
                    const pendingRangeStart =
                      mode === 'range' &&
                      range?.start != null &&
                      range.end == null &&
                      isSameDay(day.date, range.start);
                    const rangeSlot =
                      mode === 'range' ? getRangeSlot(day.date, range) : null;
                    const isToday = isSameDay(day.date, today);
                    const isActive =
                      selectedSingle ||
                      pendingRangeStart ||
                      rangeSlot === 'single';
                    const inRange =
                      rangeSlot === 'start' ||
                      rangeSlot === 'middle' ||
                      rangeSlot === 'end';
                    const emphasized = isToday && !isActive && !inRange;

                    return (
                      <Pressable
                        key={dateKey(day.date)}
                        accessibilityRole="button"
                        accessibilityLabel={formatLongDate(day.date)}
                        accessibilityState={{
                          selected: isActive || inRange,
                        }}
                        onPress={() => handleSelectDay(day.date)}
                        style={[
                          styles.daySlot,
                          rangeSlot === 'start' && styles.rangeStart,
                          rangeSlot === 'end' && styles.rangeEnd,
                          isActive && styles.rangeSingle,
                        ]}
                      >
                        <View
                          style={[
                            styles.dayBase,
                            (isActive || inRange) && styles.rangeFill,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              !day.inMonth && styles.dayTextOutside,
                              day.inMonth && styles.dayTextInMonth,
                              emphasized && styles.dayTextEmphasis,
                              (isActive || inRange) && styles.dayTextOnRange,
                            ]}
                          >
                            {day.date.getDate()}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: OttoColors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthLabel: {
    fontFamily: OttoFonts.semiBold,
    fontSize: 14,
    lineHeight: 22,
    color: OttoColors.text,
  },
  paneClip: {
    overflow: 'hidden',
  },
  pane: {
    alignSelf: 'stretch',
  },
  grid: {
    gap: 4,
  },
  weekdayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  weekday: {
    flex: 1,
    ...OttoTypography.captionSmall,
    color: OttoColors.textSoft,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daySlot: {
    flex: 1,
    height: 32,
  },
  dayBase: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    ...OttoTypography.bodySmall,
    textAlign: 'center',
  },
  dayTextOutside: {
    color: OttoColors.borderStrong,
  },
  dayTextInMonth: {
    color: OttoColors.textSoft,
  },
  dayTextEmphasis: {
    color: OttoColors.text,
    fontFamily: OttoFonts.semiBold,
  },
  dayTextOnRange: {
    color: OttoColors.buttonFilledText,
    fontFamily: OttoFonts.semiBold,
  },
  rangeFill: {
    backgroundColor: OttoColors.primarySoft,
  },
  rangeStart: {
    overflow: 'hidden',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  rangeEnd: {
    overflow: 'hidden',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  rangeSingle: {
    overflow: 'hidden',
    borderRadius: 4,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthCell: {
    width: '33.333%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
