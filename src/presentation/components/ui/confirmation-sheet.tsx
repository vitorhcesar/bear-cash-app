import { StyleSheet, View } from 'react-native';

import { Button, type ButtonProps } from '@/presentation/components/ui/button';
import { Sheet } from '@/presentation/components/ui/sheet';

export type ConfirmationSheetProps = {
  visible: boolean;
  title: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmVariant?: Extract<ButtonProps['variant'], 'filled' | 'danger'>;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmationSheet({
  visible,
  title,
  description,
  cancelLabel = 'Cancelar',
  confirmLabel = 'Confirmar',
  confirmVariant = 'danger',
  loading = false,
  onClose,
  onConfirm,
}: ConfirmationSheetProps) {
  function handleClose() {
    if (loading) {
      return;
    }
    onClose();
  }

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title={title}
      subtitle={description}
      closeOnBackdropPress={!loading}
      contentStyle={styles.content}
    >
      <View style={styles.actions}>
        <Button
          label={cancelLabel}
          variant="stroke"
          style={styles.actionButton}
          disabled={loading}
          onPress={handleClose}
        />
        <Button
          label={confirmLabel}
          variant={confirmVariant}
          style={styles.actionButton}
          loading={loading}
          onPress={onConfirm}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 10,
  },
});
