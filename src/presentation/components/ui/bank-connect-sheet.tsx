import { useRef, type ComponentType, type ReactNode } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import {
  BankConnectBuildingIcon,
  BankConnectClockIcon,
  BankConnectSwapIcon,
  BearCashConnectLogo,
} from '@/presentation/components/ui/bank-connect-icons';
import { Button } from '@/presentation/components/ui/button';
import { SettingsBiometricsIcon } from '@/presentation/components/ui/settings-icons';
import { Sheet } from '@/presentation/components/ui/sheet';
import { BearCashColors, BearCashFonts, BearCashTypography } from '@/presentation/constants/theme';

type BankLogoProps = {
  size?: number;
};

export type BankConnectTarget = {
  name: string;
  Logo: ComponentType<BankLogoProps>;
};

export type BankConnectSheetProps = {
  visible: boolean;
  bank: BankConnectTarget | null;
  userName: string;
  cpfLabel: string;
  onClose: () => void;
};

const LOGO_SIZE = 64;
const LOGO_BORDER = '#212220';

function InfoCard({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.iconWrap}>{icon}</View>
        <View style={styles.cardCopy}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

export function BankConnectSheet({
  visible,
  bank,
  userName,
  cpfLabel,
  onClose,
}: BankConnectSheetProps) {
  const lastBankRef = useRef(bank);
  if (bank) {
    lastBankRef.current = bank;
  }

  const current = bank ?? lastBankRef.current;
  if (!current) {
    return null;
  }

  const { Logo, name } = current;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Conectar conta"
      contentStyle={styles.sheet}
    >
      <View style={styles.body}>
        <View style={styles.logos}>
          <View style={styles.logoFrame}>
            <Logo size={LOGO_SIZE} />
          </View>
          <BankConnectSwapIcon size={24} />
          <View style={styles.logoFrame}>
            <BearCashConnectLogo size={LOGO_SIZE} />
          </View>
        </View>

        <View style={styles.bottom}>
          <View style={styles.cards}>
            <InfoCard
              icon={
                <SettingsBiometricsIcon size={12} color={BearCashColors.buttonFilled} />
              }
              title={userName}
              subtitle={cpfLabel}
            />
            <InfoCard
              icon={
                <BankConnectBuildingIcon size={12} color={BearCashColors.buttonFilled} />
              }
              title={name}
              subtitle="Cadastro, conta, cartão de crédito, cambio e investimento (Sem prazo)"
            />
          </View>

          <View style={styles.actions}>
            <Button
              label="Conectar"
              variant="filled"
              onPress={() => Alert.alert('Em breve')}
            />
            <View style={styles.hint}>
              <BankConnectClockIcon size={16} />
              <Text style={styles.hintText}>
                Você será direcionado para o {name}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 16,
  },
  body: {
    gap: 32,
    alignItems: 'center',
  },
  logos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoFrame: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 0.8,
    borderColor: LOGO_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    alignSelf: 'stretch',
    gap: 24,
  },
  cards: {
    gap: 16,
  },
  card: {
    backgroundColor: BearCashColors.surface,
    borderRadius: 12,
    padding: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    backgroundColor: BearCashColors.neutralBlackSoft,
    borderRadius: 8,
    padding: 6,
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cardTitle: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 14,
    lineHeight: 22,
    color: BearCashColors.textMid,
  },
  cardSubtitle: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  actions: {
    gap: 12,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  hintText: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
});
