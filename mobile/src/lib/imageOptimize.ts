// Resize + recompress de imagens antes de enviar pro backend.
// Backend limita uploads a 500 KB (regra de negócio §457). Câmera direta gera
// fotos de 2-5 MB; sem otimização o POST volta com 413.

import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';

const MAX_WIDTH = 1280;
const COMPRESS = 0.7;

export async function optimizeImage(uri: string): Promise<{ uri: string; type: 'image/jpeg' }> {
  const result = await manipulateAsync(uri, [{ resize: { width: MAX_WIDTH } }], {
    compress: COMPRESS,
    format: SaveFormat.JPEG,
  });
  return { uri: result.uri, type: 'image/jpeg' };
}
