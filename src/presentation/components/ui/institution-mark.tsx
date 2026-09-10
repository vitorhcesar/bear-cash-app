import { Image } from 'expo-image';
import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  BancoDoBrasilLogo,
  C6Logo,
  CaixaLogo,
  ItauLogo,
  NubankLogo,
  SantanderLogo,
} from '@/presentation/components/ui/bank-logos';
import { BearCashColors, BearCashFonts } from '@/presentation/constants/theme';

type InstitutionMarkProps = {
  name: string;
  logoUrl?: string | null;
  size?: number;
};

type LogoProps = {
  size?: number;
};

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function localLogoFor(name: string): ComponentType<LogoProps> | null {
  const normalized = normalizeName(name);

  if (normalized.includes('nubank')) {
    return NubankLogo;
  }
  if (normalized.includes('santander')) {
    return SantanderLogo;
  }
  if (normalized.includes('banco do brasil')) {
    return BancoDoBrasilLogo;
  }
  if (/\bc6\b/.test(normalized) || normalized.includes('c6 bank')) {
    return C6Logo;
  }
  if (normalized.includes('caixa')) {
    return CaixaLogo;
  }
  if (normalized.includes('itau')) {
    return ItauLogo;
  }

  return null;
}

export function InstitutionMark({ name, logoUrl, size = 32 }: InstitutionMarkProps) {
  const LocalLogo = localLogoFor(name);
  const initial = name.trim().charAt(0).toUpperCase() || 'B';

  if (logoUrl) {
    return (
      <View
        style={[
          styles.frame,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Image
          source={{ uri: logoUrl }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={logoUrl}
        />
      </View>
    );
  }

  if (LocalLogo) {
    return <LocalLogo size={size} />;
  }

  return (
    <View
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.initial, { fontSize: Math.round(size * 0.4) }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderWidth: 0.4,
    borderColor: '#212220',
    backgroundColor: BearCashColors.neutralBlackSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initial: {
    fontFamily: BearCashFonts.semiBold,
    color: BearCashColors.textMid,
  },
});
