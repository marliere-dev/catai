import { Camera, Map as MapView } from '@maplibre/maplibre-react-native';
import { StyleSheet, View } from 'react-native';

import { MapPin } from './MapPin';
import { PALETTE } from '@/theme/tokens';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const FALLBACK_CENTER: [number, number] = [-46.6333, -23.5505];
const DEFAULT_ZOOM = 15;

export interface MapPreviewProps {
  latitude?: number;
  longitude?: number;
  height?: number;
  pulse?: boolean;
  radius?: number;
}

// Versão native: mapa real MapLibre, estático (sem gestos). Pino fixo no
// centro pra marcar a posição. Use `pulse` quando quiser destaque.
export function MapPreview({
  latitude,
  longitude,
  height = 180,
  pulse = false,
  radius = 14,
}: MapPreviewProps) {
  const center: [number, number] =
    latitude != null && longitude != null ? [longitude, latitude] : FALLBACK_CENTER;
  return (
    <View style={[styles.wrap, { height, borderRadius: radius }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        mapStyle={STYLE_URL}
        dragPan={false}
        touchZoom={false}
        doubleTapZoom={false}
        doubleTapHoldZoom={false}
        touchRotate={false}
        touchPitch={false}
        attribution={false}
        logo={false}
        compass={false}
      >
        <Camera initialViewState={{ center, zoom: DEFAULT_ZOOM }} />
      </MapView>
      <View style={styles.pinAnchor} pointerEvents="none">
        <MapPin pulse={pulse} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.line,
    backgroundColor: PALETTE.soft,
    position: 'relative',
  },
  pinAnchor: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
  },
});
