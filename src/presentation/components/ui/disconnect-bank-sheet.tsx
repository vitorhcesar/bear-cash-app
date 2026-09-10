import { ConfirmationSheet } from '@/presentation/components/ui/confirmation-sheet';

export type DisconnectBankSheetProps = {
  visible: boolean;
  bankName?: string | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DisconnectBankSheet({
  visible,
  bankName,
  loading = false,
  onClose,
  onConfirm,
}: DisconnectBankSheetProps) {
  const name = bankName?.trim() || 'este banco';

  return (
    <ConfirmationSheet
      visible={visible}
      loading={loading}
      title="Desconectar banco"
      description={`Revogar o acesso a ${name}? As transações ficam ocultas dos totais.`}
      confirmLabel="Desconectar"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
