import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { FilterCheckboxOnIcon } from '@/presentation/components/ui/activities-filter-icons';
import {
  CURRENCIES,
  formatCurrencyLabel,
  getCurrency,
  type Currency,
} from '@/presentation/components/ui/currencies';
import { TransactionChevronDownIcon } from '@/presentation/components/ui/new-transaction-icons';
import {
  OttoColors,
  OttoFonts,
  OttoTypography,
} from '@/presentation/constants/theme';

const VISIBLE_ROWS = 5;
const ROW_HEIGHT = 38;
const ROW_GAP = 1;
const ITEM_SIZE = ROW_HEIGHT + ROW_GAP;
const LIST_HEIGHT = VISIBLE_ROWS * ROW_HEIGHT + (VISIBLE_ROWS - 1) * ROW_GAP;
const CONTENT_HEIGHT = CURRENCIES.length * ITEM_SIZE;
const OVERSCAN = 6;
const WINDOW_SIZE = VISIBLE_ROWS + OVERSCAN * 2;
const SCROLLBAR_MIN_THUMB = 39;
const SELECTED_ROW_BG = '#171816';
const SCROLLBAR_THUMB = '#0e7905';

export type CurrencyPickerProps = {
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (code: string) => void;
  label?: string;
};

function windowStartForOffset(offset: number) {
  return Math.max(0, Math.floor(offset / ITEM_SIZE) - OVERSCAN);
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={styles.checkboxOuter} accessibilityState={{ checked }}>
      {checked ? (
        <FilterCheckboxOnIcon size={20} />
      ) : (
        <View style={styles.checkboxBox}>
          <View style={styles.checkboxInner} />
        </View>
      )}
    </View>
  );
}

const CurrencyRow = memo(function CurrencyRow({
  currency,
  checked,
  onPress,
}: {
  currency: Currency;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: checked }}
      onPress={onPress}
      style={[styles.row, checked && styles.rowSelected]}
    >
      <Text
        style={[styles.rowLabel, checked && styles.rowLabelSelected]}
        numberOfLines={1}
      >
        {formatCurrencyLabel(currency)}
      </Text>
      <Checkbox checked={checked} />
    </Pressable>
  );
});

export function CurrencyPicker({
  value,
  open,
  onOpenChange,
  onChange,
  label,
}: CurrencyPickerProps) {
  const selected = getCurrency(value);
  const listRef = useRef<ScrollView>(null);
  const thumbRef = useRef<View>(null);
  const startRef = useRef(0);
  const [start, setStart] = useState(0);

  const selectedIndex = useMemo(() => {
    const index = CURRENCIES.findIndex(
      (currency) => currency.code === selected.code,
    );
    return Math.max(index, 0);
  }, [selected.code]);

  const overflow = Math.max(CONTENT_HEIGHT - LIST_HEIGHT, 1);
  const thumbHeight = Math.max(
    SCROLLBAR_MIN_THUMB,
    (LIST_HEIGHT / Math.max(CONTENT_HEIGHT, LIST_HEIGHT)) * LIST_HEIGHT,
  );
  const thumbTravel = Math.max(LIST_HEIGHT - thumbHeight, 1);
  const initialOffset = Math.min(selectedIndex * ITEM_SIZE, overflow);
  const initialThumbTop = Math.min(
    thumbTravel,
    (initialOffset / overflow) * thumbTravel,
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextStart = windowStartForOffset(initialOffset);
    startRef.current = nextStart;
    setStart(nextStart);

    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ y: initialOffset, animated: false });
    });
  }, [open, initialOffset]);

  const updateThumb = useCallback(
    (offset: number) => {
      const next = Math.min(thumbTravel, (offset / overflow) * thumbTravel);
      thumbRef.current?.setNativeProps({
        style: { transform: [{ translateY: next }] },
      });
    },
    [overflow, thumbTravel],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = event.nativeEvent.contentOffset.y;
      updateThumb(offset);

      const nextStart = windowStartForOffset(offset);
      if (nextStart !== startRef.current) {
        startRef.current = nextStart;
        setStart(nextStart);
      }
    },
    [updateThumb],
  );

  const visible = CURRENCIES.slice(start, start + WINDOW_SIZE);
  const padTop = start * ITEM_SIZE;
  const padBottom = Math.max(
    0,
    CONTENT_HEIGHT - padTop - visible.length * ITEM_SIZE,
  );

  return (
    <View>
      {label ? (
        <View style={styles.labelRow} pointerEvents="none">
          <View style={styles.labelBackground}>
            <Text style={styles.floatingLabel}>{label}</Text>
          </View>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? 'Selecionar moeda'}
        accessibilityState={{ expanded: open }}
        onPress={() => onOpenChange(!open)}
        style={[styles.field, open && styles.fieldOpen]}
      >
        <Text style={styles.fieldValue}>{formatCurrencyLabel(selected)}</Text>
        <View style={styles.chevron}>
          <TransactionChevronDownIcon
            size={16}
            color={open ? OttoColors.primary : undefined}
          />
        </View>
      </Pressable>

      {open ? (
        <View style={styles.dropdown}>
          <ScrollView
            ref={listRef}
            style={styles.list}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <View style={{ height: padTop }} />
            {visible.map((currency) => (
              <CurrencyRow
                key={currency.code}
                currency={currency}
                checked={currency.code === selected.code}
                onPress={() => {
                  onChange(currency.code);
                  onOpenChange(false);
                }}
              />
            ))}
            <View style={{ height: padBottom }} />
          </ScrollView>

          <View style={styles.scrollbarTrack} pointerEvents="none">
            <View
              ref={thumbRef}
              style={[
                styles.scrollbarThumb,
                {
                  height: thumbHeight,
                  transform: [{ translateY: initialThumbTop }],
                },
              ]}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    position: 'absolute',
    top: -8,
    left: 13,
    zIndex: 2,
  },
  labelBackground: {
    backgroundColor: OttoColors.background,
    paddingHorizontal: 4,
  },
  floatingLabel: {
    ...OttoTypography.captionSmall,
    color: OttoColors.text,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: OttoColors.borderSoft,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 46,
  },
  fieldOpen: {
    borderColor: OttoColors.borderStrong,
  },
  fieldValue: {
    flex: 1,
    ...OttoTypography.body,
    color: OttoColors.text,
  },
  chevron: {
    width: 16,
    height: 16,
    overflow: 'hidden',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 2,
    marginTop: 2,
    height: LIST_HEIGHT,
    borderRadius: 8,
    backgroundColor: OttoColors.background,
    overflow: 'hidden',
  },
  list: {
    flex: 1,
    height: LIST_HEIGHT,
  },
  row: {
    height: ROW_HEIGHT,
    marginBottom: ROW_GAP,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: OttoColors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  rowSelected: {
    backgroundColor: SELECTED_ROW_BG,
  },
  rowLabel: {
    flex: 1,
    ...OttoTypography.bodySmall,
    color: OttoColors.text,
  },
  rowLabelSelected: {
    fontFamily: OttoFonts.semiBold,
  },
  scrollbarTrack: {
    width: 4,
    borderRadius: 16,
    backgroundColor: OttoColors.surface,
    overflow: 'hidden',
  },
  scrollbarThumb: {
    width: 4,
    borderRadius: 4,
    backgroundColor: SCROLLBAR_THUMB,
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: OttoColors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInner: {
    width: 13,
    height: 13,
    borderRadius: 2.6,
    backgroundColor: OttoColors.background,
    shadowColor: '#1B1C1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
});
