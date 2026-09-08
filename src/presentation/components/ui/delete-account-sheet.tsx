import { ConfirmationSheet } from '@/presentation/components/ui/confirmation-sheet';

export type DeleteAccountSheetProps = {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteAccountSheet({
  visible,
  loading = false,
  onClose,
  onConfirm,
}: DeleteAccountSheetProps) {
  return (
    <ConfirmationSheet
      visible={visible}
      loading={loading}
      title="Excluir conta"
      description="Isso apaga sua conta, perfil, sessões e dados associados. Esta ação não pode ser desfeita."
      confirmLabel="Excluir"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
