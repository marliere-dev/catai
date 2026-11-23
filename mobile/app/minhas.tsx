import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { requestsApi } from '@/api/requests';
import { Button, Chip, EmptyState, ScreenShell, StatusBadge, TopBar } from '@/components';
import { RIcon } from '@/icons/RIcon';
import { materialOf, quantityLabel, relativeTime, statusLabel } from '@/lib/labels';
import { FONTS, PALETTE } from '@/theme/tokens';
import type { CollectionRequest, RequestStatus } from '@/types/api';

type Filter = 'tudo' | 'aberta' | 'reservada' | 'concluida' | 'cancelada';

const FILTER_TO_STATUS: Record<Exclude<Filter, 'tudo'>, RequestStatus> = {
  aberta: 'OPEN',
  reservada: 'RESERVED',
  concluida: 'COMPLETED',
  cancelada: 'CANCELLED',
};

export default function Minhas() {
  const router = useRouter();
  const [items, setItems] = useState<CollectionRequest[]>([]);
  const [filter, setFilter] = useState<Filter>('tudo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await requestsApi.listMy());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visible =
    filter === 'tudo' ? items : items.filter((it) => it.status === FILTER_TO_STATUS[filter]);

  return (
    <ScreenShell>
      <TopBar title="Minhas solicitações" onBack={() => router.replace('/(dono)/home')} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filters}
      >
        {(['tudo', 'aberta', 'reservada', 'concluida', 'cancelada'] as Filter[]).map((f) => (
          <Chip key={f} size="sm" active={filter === f} onPress={() => setFilter(f)}>
            {f}
          </Chip>
        ))}
      </ScrollView>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 16 }}
        data={visible}
        keyExtractor={(it) => it.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={PALETTE.sageDeep} />
        }
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              illo="sprout"
              title={error ? 'sem conexão' : 'ainda não tem nada por aqui'}
              body={
                error
                  ? 'puxa pra baixo pra tentar de novo.'
                  : 'quando você publicar uma solicitação, ela aparece aqui.'
              }
              cta={
                !error && (
                  <Button variant="primary" full={false} onPress={() => router.push('/nova')}>
                    criar a primeira
                  </Button>
                )
              }
            />
          )
        }
        renderItem={({ item }) => (
          <MinhaCard item={item} onPress={() => router.push(`/detalhe/${item.id}?ctx=donoOpen`)} />
        )}
      />
    </ScreenShell>
  );
}

interface CardProps {
  item: CollectionRequest;
  onPress: () => void;
}

function MinhaCard({ item, onPress }: CardProps) {
  const m = materialOf(item.materialType);
  const q = quantityLabel(item.quantityEstimate);
  const status = statusLabel(item.status);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { transform: [{ translateY: -1 }] }]}
    >
      <View style={styles.thumb}>
        <RIcon name={m.icon} size={26} color={PALETTE.sageDeep} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.cardTitle}>
          {m.label}, {q}
        </Text>
        <View style={styles.metaRow}>
          {status !== 'expirada' ? (
            <StatusBadge status={status as 'aberta' | 'reservada' | 'concluida' | 'cancelada'} />
          ) : (
            <StatusBadge status="cancelada" />
          )}
          <Text style={styles.metaText}>{relativeTime(item.createdAt)}</Text>
        </View>
      </View>
      <RIcon name="chevronRight" size={16} color={PALETTE.inkSoft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filtersScroll: {
    flexGrow: 0,
  },
  filters: {
    gap: 8,
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 14,
  },
  card: {
    backgroundColor: PALETTE.paper,
    borderWidth: 1,
    borderColor: PALETTE.line,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: PALETTE.soft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.line,
  },
  cardTitle: {
    fontFamily: FONTS.displayItalic,
    fontSize: 18,
    color: PALETTE.ink,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: PALETTE.inkSoft,
  },
});
