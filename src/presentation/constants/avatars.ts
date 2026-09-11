import type { ImageSource } from 'expo-image';

import { CUSTOM_AVATAR_ID } from '@/domain/avatar/avatar.type';

export interface IAvatarOption {
  id: string;
  source: ImageSource;
}

/** Preset profile avatars — Metro requires static string literals in require() */
export const DEFAULT_AVATARS: IAvatarOption[] = [
  { id: 'avatar-1', source: require('@/assets/images/auth/avatar-1.png') },
  { id: 'avatar-2', source: require('@/assets/images/auth/avatar-2.png') },
  { id: 'avatar-3', source: require('@/assets/images/auth/avatar-3.png') },
  { id: 'avatar-4', source: require('@/assets/images/auth/avatar-4.png') },
  { id: 'avatar-5', source: require('@/assets/images/auth/avatar-5.png') },
  { id: 'avatar-6', source: require('@/assets/images/auth/avatar-6.png') },
  { id: 'avatar-7', source: require('@/assets/images/auth/avatar-7.png') },
  { id: 'avatar-8', source: require('@/assets/images/auth/avatar-8.png') },
];

export function getAvatarOption(
  avatarKey: string | null | undefined,
  fallback: IAvatarOption = DEFAULT_AVATARS[0],
): IAvatarOption {
  const match = DEFAULT_AVATARS.find((avatar) => avatar.id === avatarKey);
  return match ?? fallback;
}

export function createCustomAvatar(uri: string): IAvatarOption {
  return { id: CUSTOM_AVATAR_ID, source: { uri } };
}

export function isCustomAvatar(avatar: IAvatarOption): boolean {
  return avatar.id === CUSTOM_AVATAR_ID;
}

export function getAvatarUri(avatar: IAvatarOption): string | null {
  const source = avatar.source;
  if (source && typeof source === 'object' && 'uri' in source && typeof source.uri === 'string') {
    return source.uri;
  }
  return null;
}

export function resolveAvatarSource(
  avatarKey: string | null | undefined,
  avatarUrl?: string | null,
  fallback: IAvatarOption = DEFAULT_AVATARS[0],
): IAvatarOption {
  if (avatarUrl) {
    return createCustomAvatar(avatarUrl);
  }
  return getAvatarOption(avatarKey, fallback);
}
