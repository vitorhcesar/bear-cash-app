import { cropRotateAndCompressWebp } from '@/infra/image/image-manipulator.client';
import { pickProfilePhotoFromLibrary } from '@/infra/image/image-picker.client';

export async function pickProfilePhoto() {
  return pickProfilePhotoFromLibrary();
}

export async function prepareProfilePhoto(uri: string, rotationDegrees: number) {
  return cropRotateAndCompressWebp(uri, rotationDegrees);
}
