import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export type ProfilePhotoCropInput = {
  rotationDegrees: number;
  originX: number;
  originY: number;
  width: number;
  height: number;
};

export type PreparedProfilePhoto = {
  uri: string;
  width: number;
  height: number;
};

function normalizeRotation(degrees: number) {
  return ((degrees % 360) + 360) % 360;
}

export async function cropRotateAndCompressWebp(
  uri: string,
  crop: ProfilePhotoCropInput,
): Promise<PreparedProfilePhoto> {
  const rotation = normalizeRotation(crop.rotationDegrees);
  const originX = Math.max(0, Math.round(crop.originX));
  const originY = Math.max(0, Math.round(crop.originY));
  const width = Math.max(1, Math.round(crop.width));
  const height = Math.max(1, Math.round(crop.height));

  const result = await manipulateAsync(
    uri,
    [
      { crop: { originX, originY, width, height } },
      ...(rotation === 0 ? [] : [{ rotate: rotation }]),
      { resize: { width: 512, height: 512 } },
    ],
    {
      compress: 0.8,
      format: SaveFormat.WEBP,
    },
  );

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
  };
}
