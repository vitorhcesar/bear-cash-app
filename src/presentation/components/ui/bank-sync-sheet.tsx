import { StyleSheet, Text, View } from 'react-native';

import type { OpenFinanceConsent } from '@/infra/http/services/api/modules/open-finance.module';
import { Button } from '@/presentation/components/ui/button';
import { Sheet } from '@/presentation/components/ui/sheet';
import {
  isAuthRejected,
  isAwaitingAuthorization,
  isSyncSettled,
  isUrlExpired,
} from '@/presentation/open-finance/connect-bank';
import { BearCashColors, BearCashTypography } from '@/presentation/constants/theme';

export type BankSyncSheetProps = {
  visible: boolean;
  bankName?: string | null;
  consent: OpenFinanceConsent | null;
  loading?: boolean;
  onClose: () => void;
  onRecreate?: () => void;
};

function copyFor(consent: OpenFinanceConsent | null) {
  if (!consent) {
    return {
      title: 'Conectando banco',
      description: 'Abrindo a autorização Open Finance.',
      confirmLabel: null as string | null,
    };
  }

  if (isAuthRejected(consent.status)) {
    return {
      title: consent.status === 'EXPIRED' ? 'Autorização expirada' : 'Conexão recusada',
      description:
        consent.status === 'EXPIRED'
          ? 'A autorização no banco expirou. Você pode reconectar quando quiser.'
          : 'A autorização no banco foi recusada. Você pode tentar de novo.',
      confirmLabel: 'Fechar',
    };
  }

  if (isSyncSettled(consent)) {
    return {
      title: consent.executionStatus === 'PARTIAL_SUCCESS' ? 'Conectado, com ressalvas' : 'Banco conectado',
      description:
        consent.executionStatus === 'PARTIAL_SUCCESS'
          ? 'Os dados principais já estão disponíveis. Alguns detalhes podem chegar em seguida.'
          : 'Contas e transações já podem aparecer no app. A sincronização continua em segundo plano.',
      confirmLabel: 'Continuar',
    };
  }

  if (isAwaitingAuthorization(consent) && isUrlExpired(consent)) {
    return {
      title: 'Autorização expirou',
      description: `O link do ${consent.institutionName} vale por 1 hora. Gere um novo para continuar.`,
      confirmLabel: 'Gerar novo link',
    };
  }

  if (isAwaitingAuthorization(consent)) {
    return {
      title: 'Autorize no banco',
      description: `Abra o app do ${consent.institutionName} e aprove o acesso Open Finance.`,
      confirmLabel: null,
    };
  }

  if (consent.executionStatus === 'AWAITING_RESOURCES') {
    return {
      title: 'Sincronizando',
      description: 'O banco ainda está enviando contas e transações. Isso pode levar alguns minutos.',
      confirmLabel: null,
    };
  }

  return {
    title: 'Quase lá',
    description: 'Aguardando o banco confirmar a conexão. Você pode voltar depois; a sincronização continua.',
    confirmLabel: 'Fechar',
  };
}

export function BankSyncSheet({
  visible,
  bankName,
  consent,
  loading = false,
  onClose,
  onRecreate,
}: BankSyncSheetProps) {
  const copy = copyFor(consent);
  const expired = Boolean(consent && isAwaitingAuthorization(consent) && isUrlExpired(consent));
  const canDismiss =
    !loading &&
    Boolean(
      consent &&
        (isSyncSettled(consent) ||
          isAuthRejected(consent.status) ||
          expired ||
          copy.confirmLabel === 'Fechar'),
    );

  return (
    <Sheet
      visible={visible}
      onClose={canDismiss ? onClose : () => undefined}
      title={copy.title}
      subtitle={bankName ? undefined : copy.description}
      showCloseButton={canDismiss}
      closeOnBackdropPress={canDismiss}
      contentStyle={styles.content}
    >
      <View style={styles.body}>
        {bankName ? <Text style={styles.description}>{copy.description}</Text> : null}
        <View style={styles.actions}>
          {expired && onRecreate ? (
            <Button
              label="Gerar novo link"
              variant="filled"
              loading={loading}
              onPress={onRecreate}
            />
          ) : null}
          {copy.confirmLabel && !expired ? (
            <Button label={copy.confirmLabel} variant="filled" onPress={onClose} />
          ) : null}
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
  },
  body: {
    gap: 16,
  },
  description: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textMid,
  },
  actions: {
    gap: 8,
  },
});
