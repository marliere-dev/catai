// Render real do mapa em iOS/Android usando MapLibre RN.
// A versão web (`MapaCanvas.web.tsx`) é um placeholder; Metro escolhe
// automaticamente conforme a plataforma.

import { Camera, MapProps, Map as MapView, Marker } from '@maplibre/maplibre-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { RIcon } from '@/icons/RIcon';
import { materialOf } from '@/lib/labels';
import { PALETTE } from '@/theme/tokens';
import type { CollectionRequest } from '@/types/api';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export interface MapaCanvasProps {
  items: CollectionRequest[];
  center: [number, number]; // [lng, lat]
  zoom: number;
  onSelect: (item: CollectionRequest) => void;
}

export function MapaCanvas({ items, center, zoom, onSelect }: MapaCanvasProps) {
  const mapProps: MapProps = {
    style: { flex: 1 },
    mapStyle: STYLE_URL,
  };
  return (
    <MapView {...mapProps}>
      <Camera initialViewState={{ center, zoom }} />
      {items.map((it) => {
        const m = materialOf(it.materialType);
        return (
          <Marker key={it.id} id={it.id} lngLat={[it.longitude, it.latitude]}>
            <Pressable onPress={() => onSelect(it)} style={styles.pin}>
              <View style={styles.pinIcon}>
                <RIcon name={m.icon} size={16} color={PALETTE.ink} />
              </View>
            </Pressable>
          </Marker>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: PALETTE.paper,
    borderWidth: 2,
    borderColor: PALETTE.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
