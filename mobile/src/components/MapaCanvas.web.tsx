// Versão web do canvas de mapa: MapLibre é nativo (codegenNativeComponent),
// quebra no bundle web. Mostra um placeholder que orienta o usuário a usar a
// versão nativa.

import { StyleSheet, Text, View } from 'react-native';

import { FONTS, PALETTE } from '@/theme/tokens';
import type { CollectionRequest } from '@/types/api';

export interface MapaCanvasProps {
  items: CollectionRequest[];
  center: [number, number];
  zoom: number;
  onSelect: (item: CollectionRequest) => void;
}

export function MapaCanvas(_: MapaCanvasProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>mapa só no app</Text>
      <Text style={styles.body}>
        o mapa usa MapLibre nativo, então só funciona no dev build (iOS/Android). aqui na versão web
        a gente continua usando a lista de pedidos.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: PALETTE.soft,
  },
  title: {
    fontFamily: FONTS.displayItalic,
    fontSize: 24,
    color: PALETTE.ink,
    textAlign: 'center',
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: PALETTE.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
});
