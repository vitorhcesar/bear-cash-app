import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextInputKeyPressEventData,
  type ViewStyle,
} from 'react-native';

import { BearCashColors, BearCashFonts } from '@/presentation/constants/theme';

export type OtpFieldProps = {
  length?: number;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  autoFocus?: boolean;
};

function toDigitList(value: string, length: number) {
  const cleaned = value.replace(/\D/g, '').slice(0, length);
  return Array.from({ length }, (_, index) => cleaned[index] ?? '');
}

export function OtpField({
  length = 6,
  value,
  onChangeText,
  error,
  containerStyle,
  autoFocus = true,
}: OtpFieldProps) {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const digitsRef = useRef<string[]>(toDigitList(value, length));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const digits = toDigitList(value, length);
  const hasError = Boolean(error);

  digitsRef.current = digits;

  useEffect(() => {
    if (!autoFocus) {
      return;
    }

    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, [autoFocus]);

  function commit(next: string[]) {
    digitsRef.current = next;
    onChangeText(next.join(''));
  }

  function focusIndex(index: number) {
    requestAnimationFrame(() => {
      inputRefs.current[index]?.focus();
    });
  }

  function handleChangeAt(index: number, text: string) {
    const cleaned = text.replace(/\D/g, '');
    const current = [...digitsRef.current];

    if (cleaned.length === 0) {
      current[index] = '';
      commit(current);
      return;
    }

    // Paste / autofill can arrive as multiple digits in one cell
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, length - index).split('');
      chars.forEach((char, offset) => {
        current[index + offset] = char;
      });
      commit(current);
      focusIndex(Math.min(index + chars.length, length - 1));
      return;
    }

    current[index] = cleaned;
    commit(current);

    if (index < length - 1) {
      focusIndex(index + 1);
    }
  }

  function handleBackspace(index: number) {
    const current = [...digitsRef.current];

    if (current[index]) {
      current[index] = '';
      commit(current);
      return;
    }

    if (index === 0) {
      return;
    }

    current[index - 1] = '';
    commit(current);
    focusIndex(index - 1);
  }

  function handleKeyPressAt(
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) {
    if (event.nativeEvent.key !== 'Backspace') {
      return;
    }

    handleBackspace(index);
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <View
        style={[
          styles.shell,
          hasError && styles.shellError,
          focusedIndex !== null && styles.shellFocused,
        ]}>
        {digits.map((digit, index) => {
          const isLast = index === length - 1;

          return (
            <View key={index} style={[styles.cell, !isLast && styles.cellDivider]}>
              <TextInput
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                value={digit}
                onChangeText={(text) => handleChangeAt(index, text)}
                onKeyPress={(event) => handleKeyPressAt(index, event)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() =>
                  setFocusedIndex((current) => (current === index ? null : current))
                }
                keyboardType="number-pad"
                textContentType={index === 0 ? 'oneTimeCode' : 'none'}
                autoComplete={index === 0 ? 'sms-otp' : 'off'}
                maxLength={length}
                selectTextOnFocus
                style={styles.input}
                placeholder="0"
                placeholderTextColor={BearCashColors.textSoft}
                caretHidden
                accessibilityLabel={`Dígito ${index + 1} de ${length}`}
              />
            </View>
          );
        })}
      </View>

      {hasError ? <Text style={styles.errorHint}>{error}</Text> : null}
    </View>
  );
}

const CELL_HEIGHT = 56;

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    gap: 10,
  },
  shell: {
    flexDirection: 'row',
    alignItems: 'stretch',
    alignSelf: 'stretch',
    height: CELL_HEIGHT,
    borderWidth: 1,
    borderColor: BearCashColors.borderSoft,
    borderRadius: 8,
    backgroundColor: BearCashColors.background,
  },
  shellFocused: {
    borderColor: BearCashColors.borderStrong,
  },
  shellError: {
    borderColor: BearCashColors.error,
  },
  cell: {
    flex: 1,
    height: CELL_HEIGHT - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellDivider: {
    borderRightWidth: 1,
    borderRightColor: BearCashColors.borderSoft,
  },
  input: {
    width: '100%',
    height: '100%',
    fontSize: 18,
    fontFamily: BearCashFonts.semiBold,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
    textAlign: 'center',
    textAlignVertical: 'center',
    color: BearCashColors.text,
    padding: 0,
    margin: 0,
  },
  errorHint: {
    fontSize: 12,
    lineHeight: 19,
    fontFamily: BearCashFonts.regular,
    color: BearCashColors.errorSoft,
  },
});
