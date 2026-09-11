import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { pickProfilePhoto, prepareProfilePhoto } from '@/application/avatar/prepare-profile-photo';
import { CUSTOM_AVATAR_ID } from '@/domain/avatar/avatar.type';
import { AvatarCropSheet } from '@/presentation/components/ui/avatar-crop-sheet';
import {
  DEFAULT_AVATARS,
  createCustomAvatar,
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
  currentAvatar?: IAvatarOption;
}

export function AvatarPickerSheet({
  visible,
  onClose,
  onConfirm,
  selectedId,
  avatars = DEFAULT_AVATARS,
  currentAvatar,
}: IAvatarPickerSheetProps) {
  const [draftId, setDraftId] = useState(selectedId ?? avatars[0]?.id);
  const [draftCustom, setDraftCustom] = useState<IAvatarOption | null>(
    currentAvatar?.id === CUSTOM_AVATAR_ID ? currentAvatar : null,
  );
  const [cropUri, setCropUri] = useState<string | null>(null);
  const [cropVisible, setCropVisible] = useState(false);
  const [cropConfirming, setCropConfirming] = useState(false);

  const draft: IAvatarOption | undefined =
    draftId === CUSTOM_AVATAR_ID
      ? (draftCustom ?? currentAvatar)
      : (avatars.find((avatar) => avatar.id === draftId) ?? avatars[0]);

  const handleOpen = useCallback(() => {
    const nextId = selectedId && (selectedId === CUSTOM_AVATAR_ID || avatars.some((a) => a.id === selectedId))
      ? selectedId
      : avatars[0]?.id;
    setDraftId(nextId);
    setDraftCustom(currentAvatar?.id === CUSTOM_AVATAR_ID ? currentAvatar : null);
  }, [avatars, currentAvatar, selectedId]);

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

  async function handlePickCustom() {
    try {
      const picked = await pickProfilePhoto();
      if (!picked) {
        return;
      }
      setCropUri(picked.uri);
      setCropVisible(true);
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir a galeria.');
    }
  }

  async function handleCropConfirm(rotationDegrees: number) {
    if (!cropUri || cropConfirming) {
      return;
    }

    setCropConfirming(true);
    try {
      const prepared = await prepareProfilePhoto(cropUri, rotationDegrees);
      const custom = createCustomAvatar(prepared.uri);
      setDraftCustom(custom);
      setDraftId(CUSTOM_AVATAR_ID);
      setCropVisible(false);
      setCropUri(null);
      onConfirm(custom);
      onClose();
    } catch {
      Alert.alert('Erro', 'Não foi possível recortar a foto.');
    } finally {
      setCropConfirming(false);
    }
  }

  return (
    <>
      <Sheet
        visible={visible}
        onClose={onClose}
        onOpen={handleOpen}
        title="Escolher Avatar"
        subtitle="Selecione um avatar para o seu perfil"
      >
        <View style={styles.previewWrap}>
          {draft ? (
            <Image
              source={draft.source}
              style={styles.preview}
              contentFit="cover"
              accessibilityLabel="Avatar selecionado"
            />
          ) : (
            <View style={styles.preview} />
          )}
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

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Adicionar foto de perfil"
            accessibilityState={{ selected: draftId === CUSTOM_AVATAR_ID }}
            style={[
              styles.gridItem,
              styles.addItem,
              draftId === CUSTOM_AVATAR_ID && styles.gridItemSelected,
            ]}
            onPress={() => {
              void handlePickCustom();
            }}
          >
            {draftId === CUSTOM_AVATAR_ID && draftCustom ? (
              <Image
                source={draftCustom.source}
                style={styles.gridImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.addLabel}>+</Text>
            )}
          </Pressable>
        </View>

        <Button label="Definir" variant="filled" onPress={handleConfirm} />
      </Sheet>

      <AvatarCropSheet
        visible={cropVisible}
        uri={cropUri}
        confirming={cropConfirming}
        onCancel={() => {
          if (cropConfirming) {
            return;
          }
          setCropVisible(false);
          setCropUri(null);
        }}
        onConfirm={(rotation) => {
          void handleCropConfirm(rotation);
        }}
      />
    </>
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
  addItem: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BearCashColors.surface,
    borderColor: BearCashColors.borderStrong,
  },
  addLabel: {
    color: BearCashColors.text,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '300',
  },
});

