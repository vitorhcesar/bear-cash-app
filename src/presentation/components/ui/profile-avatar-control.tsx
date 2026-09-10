import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AvatarPickerSheet } from '@/presentation/components/ui/avatar-picker-sheet';
import { RefreshIcon } from '@/presentation/components/ui/auth-icons';
import { SettingsEditIcon } from '@/presentation/components/ui/settings-icons';
import {
  DEFAULT_AVATARS,
  type IAvatarOption,
} from '@/presentation/constants/avatars';
import { BearCashColors } from '@/presentation/constants/theme';

const ACTION_SIZE = 28;
const EDIT_BADGE_SIZE = 32;
const EDIT_BADGE_OVERLAP = 12;

export type ProfileAvatarControlProps = {
  avatar: IAvatarOption;
  onChange: (avatar: IAvatarOption) => void;
  size?: number;
  avatars?: IAvatarOption[];
  action?: 'refresh' | 'edit';
};

/** Avatar + action badge + picker sheet — same control used in auth onboarding. */
export function ProfileAvatarControl({
  avatar,
  onChange,
  size = 112,
  avatars = DEFAULT_AVATARS,
  action = 'refresh',
}: ProfileAvatarControlProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const isEdit = action === 'edit';

  return (
    <>
      <View
        style={{
          width: size,
          height: isEdit ? size + (EDIT_BADGE_SIZE - EDIT_BADGE_OVERLAP) : size,
        }}
      >
        <Image
          source={avatar.source}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: BearCashColors.borderStrong,
          }}
          contentFit="cover"
          accessibilityLabel="Foto de perfil"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Trocar foto de perfil"
          style={
            isEdit
              ? [
                  styles.avatarActionEdit,
                  {
                    left: (size - EDIT_BADGE_SIZE) / 2,
                    top: size - EDIT_BADGE_OVERLAP,
                  },
                ]
              : styles.avatarAction
          }
          onPress={() => setPickerOpen(true)}
        >
          {isEdit ? (
            <SettingsEditIcon size={16} color={BearCashColors.buttonFilledText} />
          ) : (
            <RefreshIcon size={12} color={BearCashColors.buttonFilledText} />
          )}
        </Pressable>
      </View>

      <AvatarPickerSheet
        visible={pickerOpen}
        selectedId={avatar.id}
        avatars={avatars}
        onClose={() => setPickerOpen(false)}
        onConfirm={onChange}
      />
    </>
  );
}

const styles = StyleSheet.create({
  avatarAction: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    backgroundColor: BearCashColors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActionEdit: {
    position: 'absolute',
    width: EDIT_BADGE_SIZE,
    height: EDIT_BADGE_SIZE,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: BearCashColors.background,
    backgroundColor: BearCashColors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
