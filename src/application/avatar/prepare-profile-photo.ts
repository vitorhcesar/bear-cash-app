import { cropRotateAndCompressWebp, type ProfilePhotoCropInput } from '@/infra/image/image-manipulator.client';
import { pickProfilePhotoFromLibrary } from '@/infra/image/image-picker.client';

export async function pickProfilePhoto() {
  return pickProfilePhotoFromLibrary();
}

export async function prepareProfilePhoto(uri: string, crop: ProfilePhotoCropInput) {
  return cropRotateAndCompressWebp(uri, crop);
}
