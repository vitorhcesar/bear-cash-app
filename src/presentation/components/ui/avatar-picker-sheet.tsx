import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  DEFAULT_AVATARS,
  type IAvatarOption,
} from '@/presentation/constants/avatars';
import { BearCashColors } from '@/presentation/constants/theme';

import { RefreshIcon } from './auth-icons';
import { Button } from './button';
import { Sheet } from './sheet';

const PREVIEW_SIZE = 112;
const GRID_ITEM_SIZE = 80;

export interface IAvatarPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (avatar: IAvatarOption) => void;
  /** Currently applied avatar id (opens sheet with this selected) */
  selectedId?: string;
  /** Override preset list — defaults to DEFAULT_AVATARS */
  avatars?: IAvatarOption[];
}

export function AvatarPickerSheet({
  visible,
  onClose,
  onConfirm,
  selectedId,
  avatars = DEFAULT_AVATARS,
}: IAvatarPickerSheetProps) {
  const [draftId, setDraftId] = useState(
    selectedId && avatars.some((a) => a.id === selectedId)
      ? selectedId
      : avatars[0]?.id,
  );

  const draft = avatars.find((avatar) => avatar.id === draftId) ?? avatars[0];

  const handleOpen = useCallback(() => {
    const nextId =
      selectedId && avatars.some((a) => a.id === selectedId)
        ? selectedId
        : avatars[0]?.id;
    setDraftId(nextId);
  }, [avatars, selectedId]);

  function handleCyclePreview() {
    if (avatars.length < 2) {
      return;
    }

    const index = avatars.findIndex((avatar) => avatar.id === draftId);
    const next = avatars[(index + 1) % avatars.length];
    setDraftId(next.id);
  }

  function handleConfirm() {
    if (!draft) {
      return;
    }

    onConfirm(draft);
    onClose();
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      onOpen={handleOpen}
      title="Escolher Avatar"
      subtitle="Selecione um avatar para o seu perfil"
    >
      <View style={styles.previewWrap}>
        <Image
          source={draft?.source}
          style={styles.preview}
          contentFit="cover"
          accessibilityLabel="Avatar selecionado"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Próximo avatar"
          style={styles.previewAction}
          onPress={handleCyclePreview}
        >
          <RefreshIcon size={12} color={BearCashColors.buttonFilledText} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {avatars.map((avatar) => {
          const isSelected = avatar.id === draftId;

          return (
            <Pressable
              key={avatar.id}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Avatar ${avatar.id}`}
              style={[styles.gridItem, isSelected && styles.gridItemSelected]}
              onPress={() => setDraftId(avatar.id)}
            >
              <Image
                source={avatar.source}
                style={styles.gridImage}
                contentFit="cover"
              />
            </Pressable>
          );
        })}
      </View>

      <Button label="Definir" variant="filled" onPress={handleConfirm} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  previewWrap: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    alignSelf: 'center',
    position: 'relative',
  },
  preview: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: PREVIEW_SIZE / 2,
    backgroundColor: BearCashColors.borderStrong,
  },
  previewAction: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BearCashColors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    borderRadius: GRID_ITEM_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BearCashColors.neutralBlackSoft,
  },
  gridItemSelected: {
    borderWidth: 2,
    borderColor: BearCashColors.text,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
});
