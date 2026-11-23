// Picker de localização: mapa interativo com pino fixo no centro.
// Usuário arrasta o mapa pra ajustar; centramos no GPS na primeira carga.

import {
  Camera,
  type CameraRef,
  Map as MapView,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { type NativeSyntheticEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { MapPin } from './MapPin';
import { RIcon } from '@/icons/RIcon';
import { FONTS, PALETTE } from '@/theme/tokens';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const FALLBACK_CENTER: [number, number] = [-46.6333, -23.5505]; // [lng, lat] São Paulo
const DEFAULT_ZOOM = 16;

export interface LocationPickerProps {
  height?: number;
  radius?: number;
  onChange: (coords: { latitude: number; longitude: number }) => void;
}

export function LocationPicker({ height = 200, radius = 18, onChange }: LocationPickerProps) {
  const cameraRef = useRef<CameraRef>(null);
  const [center, setCenter] = useState<[number, number]>(FALLBACK_CENTER);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) {
            setHint('ative a localização pra centralizar perto de você');
            onChange({ latitude: FALLBACK_CENTER[1], longitude: FALLBACK_CENTER[0] });
          }
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        const next: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        setCenter(next);
        cameraRef.current?.flyTo({ center: next, zoom: DEFAULT_ZOOM, duration: 600 });
        onChange({ latitude: next[1], longitude: next[0] });
      } catch {
        if (!cancelled) {
          setHint('não foi possível ler o GPS — arraste o mapa pra ajustar');
          onChange({ latitude: FALLBACK_CENTER[1], longitude: FALLBACK_CENTER[0] });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onChange]);

  const onRegionDidChange = (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    const next = event.nativeEvent.center;
    setCenter([next[0], next[1]]);
    onChange({ latitude: next[1], longitude: next[0] });
  };

  const recenter = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next: [number, number] = [pos.coords.longitude, pos.coords.latitude];
      cameraRef.current?.flyTo({ center: next, zoom: DEFAULT_ZOOM, duration: 600 });
      setCenter(next);
      onChange({ latitude: next[1], longitude: next[0] });
    } catch {
      // silencioso — o usuário pode arrastar o mapa manualmente
    }
  };

  return (
    <View>
      <View style={[styles.wrap, { height, borderRadius: radius }]}>
        <MapView
          style={StyleSheet.absoluteFill}
          mapStyle={STYLE_URL}
          onRegionDidChange={onRegionDidChange}
        >
          <Camera ref={cameraRef} initialViewState={{ center, zoom: DEFAULT_ZOOM }} />
        </MapView>
        <View pointerEvents="none" style={styles.pinAnchor}>
          <MapPin />
        </View>
        <Pressable
          onPress={recenter}
          style={styles.recenterBtn}
          accessibilityLabel="Centralizar na minha localização"
        >
          <RIcon name="pin" size={18} color={PALETTE.ink} />
        </Pressable>
      </View>
      {hint ? <Text style={styles.hintWarn}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
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
  recenterBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PALETTE.paper,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PALETTE.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  hintWarn: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: PALETTE.inkSoft,
    marginTop: 8,
    textAlign: 'center',
  },
});
