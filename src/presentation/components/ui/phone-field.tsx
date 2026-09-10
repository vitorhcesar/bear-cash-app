import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { BrazilFlag } from '@/presentation/components/ui/brazil-flag';
import { TextField } from '@/presentation/components/ui/text-field';
import { BearCashColors, BearCashTypography } from '@/presentation/constants/theme';

export type PhoneFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
};

/** Keeps only digits and formats as BR mobile: XX XXXXX-XXXX */
export function formatBrazilPhone(digits: string) {
  const cleaned = digits.replace(/\D/g, '').slice(0, 11);

  if (cleaned.length <= 2) {
    return cleaned;
  }

  if (cleaned.length <= 7) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
  }

  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
}

export function getPhoneDigits(value: string) {
  return value.replace(/\D/g, '');
}

/** Local BR digits (DDD + number), stripping +55 when present. */
export function toBrazilLocalDigits(value: string) {
  let cleaned = getPhoneDigits(value);
  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    cleaned = cleaned.slice(2);
  }
  return cleaned.slice(0, 11);
}

/** Display format matching Figma: (43) 98475-6308 */
export function formatBrazilPhoneDisplay(digits: string) {
  const cleaned = toBrazilLocalDigits(digits);

  if (cleaned.length <= 2) {
    return cleaned;
  }

  if (cleaned.length <= 7) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  }

  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
}

export function PhoneField({ value, onChangeText, containerStyle }: PhoneFieldProps) {
  return (
    <View style={[styles.row, containerStyle]}>
      <View style={styles.countryCode}>
        <BrazilFlag width={15.897} height={10.598} />
        <Text style={styles.countryCodeText}>+55</Text>
      </View>

      <TextField
        label="Telefone"
        value={value}
        onChangeText={(text) => onChangeText(formatBrazilPhone(text))}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        containerStyle={styles.phoneInput}
        maxLength={13}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    alignSelf: 'stretch',
  },
  countryCode: {
    maxWidth: 78,
    minHeight: 46,
    borderWidth: 1,
    borderColor: BearCashColors.borderSoft,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countryCodeText: {
    ...BearCashTypography.body,
    color: BearCashColors.textSoft,
  },
  phoneInput: {
    flex: 1,
  },
});
