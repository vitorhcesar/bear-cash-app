import { ConfirmationSheet } from '@/presentation/components/ui/confirmation-sheet';

export type DeleteApiKeySheetProps = {
  visible: boolean;
  keyName?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteApiKeySheet({
  visible,
  loading = false,
  onClose,
  onConfirm,
}: DeleteApiKeySheetProps) {
  return (
    <ConfirmationSheet
      visible={visible}
      loading={loading}
      title="Excluir chave"
      description="Tem certeza que deseja excluir esta chave de API? Esta ação não pode ser desfeita."
      confirmLabel="Excluir"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
