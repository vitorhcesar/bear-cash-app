import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

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
  rotationDegrees: number,
): Promise<PreparedProfilePhoto> {
  const rotation = normalizeRotation(rotationDegrees);
  const rotated = await manipulateAsync(
    uri,
    rotation === 0 ? [] : [{ rotate: rotation }],
    { compress: 1 },
  );

  const size = Math.min(rotated.width, rotated.height);
  const originX = Math.round((rotated.width - size) / 2);
  const originY = Math.round((rotated.height - size) / 2);

  const result = await manipulateAsync(
    rotated.uri,
    [
      { crop: { originX, originY, width: size, height: size } },
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
