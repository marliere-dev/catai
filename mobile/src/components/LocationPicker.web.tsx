// Versão web do LocationPicker: MapLibre é nativo (codegenNativeComponent),
// quebra no bundle web. Devolve um centro fixo (São Paulo) e instrui o usuário
// a usar o dev build pra ajustar a posição.

import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FONTS, PALETTE } from '@/theme/tokens';

const FALLBACK = { latitude: -23.5505, longitude: -46.6333 };

export interface LocationPickerProps {
  height?: number;
  radius?: number;
  onChange: (coords: { latitude: number; longitude: number }) => void;
}

export function LocationPicker({ height = 200, radius = 18, onChange }: LocationPickerProps) {
  useEffect(() => {
    onChange(FALLBACK);
  }, [onChange]);

  return (
    <View style={[styles.wrap, { height, borderRadius: radius }]}>
      <Text style={styles.title}>mapa só no app</Text>
      <Text style={styles.body}>
        o ajuste fino de localização usa MapLibre nativo. na versão web a posição cai num ponto
        padrão.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PALETTE.soft,
  },
  title: {
    fontFamily: FONTS.displayItalic,
    fontSize: 18,
    color: PALETTE.ink,
    textAlign: 'center',
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: PALETTE.inkSoft,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
});
