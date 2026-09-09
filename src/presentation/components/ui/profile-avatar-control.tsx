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
const EDIT_ACTION_SIZE = 24;

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

  return (
    <>
      <View style={{ width: size, height: size }}>
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
          style={[
            styles.avatarAction,
            action === 'edit' && styles.avatarActionEdit,
          ]}
          onPress={() => setPickerOpen(true)}
        >
          {action === 'edit' ? (
            <SettingsEditIcon size={16} />
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
    width: EDIT_ACTION_SIZE,
    height: EDIT_ACTION_SIZE,
    borderRadius: EDIT_ACTION_SIZE / 2,
    backgroundColor: BearCashColors.borderStrong,
  },
});
