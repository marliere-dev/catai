import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { requestsApi } from '@/api/requests';
import { Button, ScreenShell } from '@/components';
import { MapaCanvas } from '@/components/MapaCanvas';
import { ViewToggle } from './(catador)/pedidos';
import { RIcon } from '@/icons/RIcon';
import { materialOf, quantityLabel, relativeTime } from '@/lib/labels';
import { FONTS, PALETTE } from '@/theme/tokens';
import type { CollectionRequest } from '@/types/api';

const DEFAULT_CENTER: [number, number] = [-46.6333, -23.5505]; // [lng, lat]
const DEFAULT_ZOOM = 13;

export default function Mapa() {
  const router = useRouter();
  const [items, setItems] = useState<CollectionRequest[]>([]);
  const [selected, setSelected] = useState<CollectionRequest | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancel = false;
      (async () => {
        try {
          const list = await requestsApi.listAvailable({
            lat: DEFAULT_CENTER[1],
            lng: DEFAULT_CENTER[0],
            radiusKm: 10,
          });
          if (!cancel) {
            setItems(list);
            setSelected(list[0] ?? null);
          }
        } catch {
          // mantem mapa aberto sem pinos quando offline
        }
      })();
      return () => {
        cancel = true;
      };
    }, []),
  );

  return (
    <ScreenShell>
      <View style={{ height: 12 }} />
      <View style={styles.header}>
        <Text style={styles.title}>perto de você</Text>
        <ViewToggle view="mapa" onSwitchToLista={() => router.replace('/(catador)/pedidos')} />
      </View>
      <View style={styles.mapWrap}>
        <MapaCanvas
          items={items}
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          onSelect={setSelected}
        />
        {selected && (
          <Sheet
            item={selected}
            onClose={() => setSelected(null)}
            onOpen={(id) => router.push(`/detalhe/${id}?ctx=catadorOpen`)}
          />
        )}
      </View>
      <View style={{ height: 12 }} />
    </ScreenShell>
  );
}

interface SheetProps {
  item: CollectionRequest;
  onClose: () => void;
  onOpen: (id: string) => void;
}

function Sheet({ item, onClose, onOpen }: SheetProps) {
  const m = materialOf(item.materialType);
  return (
    <View style={styles.sheet}>
      <View style={styles.sheetRow}>
        <View style={styles.thumb}>
          <RIcon name={m.icon} size={24} color={PALETTE.sageDeep} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetTitle}>
            {m.label}, {quantityLabel(item.quantityEstimate)}
          </Text>
          <Text style={styles.sheetMeta}>
            {item.distanceKm !== undefined ? `${(item.distanceKm * 1000).toFixed(0)} m · ` : ''}
            {relativeTime(item.createdAt)}
          </Text>
        </View>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <RIcon name="x" size={14} color={PALETTE.inkSoft} />
        </Pressable>
      </View>
      <Button variant="primary" onPress={() => onOpen(item.id)}>
        Ver detalhes
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontFamily: FONTS.displayItalic,
    fontSize: 24,
    color: PALETTE.ink,
  },
  mapWrap: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.line,
  },
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: PALETTE.paper,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.line,
    shadowColor: PALETTE.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: PALETTE.soft,
    borderWidth: 1,
    borderColor: PALETTE.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontFamily: FONTS.displayItalic,
    fontSize: 17,
    color: PALETTE.ink,
  },
  sheetMeta: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: PALETTE.inkSoft,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: PALETTE.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
