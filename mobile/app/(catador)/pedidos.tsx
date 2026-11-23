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

import { meApi } from '@/api/me';
import { requestsApi } from '@/api/requests';
import { Chip, EmptyState, ScreenShell } from '@/components';
import { RIcon } from '@/icons/RIcon';
import { IconName } from '@/icons/paths';
import { materialOf, quantityLabel, relativeTime } from '@/lib/labels';
import { FONTS, PALETTE } from '@/theme/tokens';
import type { CollectionRequest } from '@/types/api';

type RaioId = '1km' | '5km' | '10km';
type Aba = 'proximos' | 'reservas';

const RAIO_VALUES: Record<RaioId, number> = {
  '1km': 1,
  '5km': 5,
  '10km': 10,
};

export default function Pedidos() {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>('proximos');
  const [raio, setRaio] = useState<RaioId>('5km');
  const [firstName, setFirstName] = useState('');
  const [proximos, setProximos] = useState<CollectionRequest[]>([]);
  const [reservas, setReservas] = useState<CollectionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProximos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Localização real virá numa fase futura; usamos São Paulo como
      // fallback até o módulo de geolocalização entrar.
      const list = await requestsApi.listAvailable({
        lat: -23.5505,
        lng: -46.6333,
        radiusKm: RAIO_VALUES[raio],
      });
      setProximos(list);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [raio]);

  const loadReservas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReservas(await requestsApi.listReservedByMe());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = aba === 'proximos' ? loadProximos : loadReservas;

  useFocusEffect(
    useCallback(() => {
      let cancel = false;
      meApi
        .fetch()
        .then((me) => {
          if (!cancel) setFirstName(me.name.split(' ')[0] ?? '');
        })
        .catch(() => undefined);
      // Sempre carrega ambas — o número de reservas é pequeno e a aba pode
      // mudar a qualquer momento sem novo refresh.
      loadProximos();
      loadReservas();
      return () => {
        cancel = true;
      };
    }, [loadProximos, loadReservas]),
  );

  const data = aba === 'proximos' ? proximos : reservas;

  return (
    <ScreenShell>
      <View style={{ height: 12 }} />
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>oi,</Text>
          <Text style={styles.name}>{firstName || '—'}</Text>
        </View>
        <ViewToggle view="lista" onSwitchToMapa={() => router.push('/mapa')} />
      </View>

      <View style={styles.tabsRow}>
        <Chip size="sm" active={aba === 'proximos'} onPress={() => setAba('proximos')}>
          Próximos
        </Chip>
        <Chip size="sm" active={aba === 'reservas'} onPress={() => setAba('reservas')}>
          Minhas reservas{reservas.length > 0 ? ` · ${reservas.length}` : ''}
        </Chip>
      </View>

      {aba === 'proximos' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.raiosScroll}
          contentContainerStyle={styles.raios}
        >
          {(['1km', '5km', '10km'] as RaioId[]).map((r) => (
            <Chip key={r} size="sm" active={raio === r} onPress={() => setRaio(r)}>
              raio {r}
            </Chip>
          ))}
        </ScrollView>
      )}

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16 }}
        data={data}
        keyExtractor={(it) => it.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={PALETTE.sageDeep} />
        }
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              title={
                error
                  ? 'sem conexão'
                  : aba === 'proximos'
                    ? 'nada por perto agora'
                    : 'nada reservado'
              }
              body={
                error
                  ? 'puxa pra baixo pra tentar de novo.'
                  : aba === 'proximos'
                    ? 'amplia o raio ou volta daqui a pouco.'
                    : 'aceita um pedido na aba Próximos pra começar.'
              }
            />
          )
        }
        renderItem={({ item }) => (
          <PedidoCard
            item={item}
            variant={aba}
            onPress={() =>
              router.push(
                `/detalhe/${item.id}?ctx=${aba === 'proximos' ? 'catadorOpen' : 'catadorReserved'}`,
              )
            }
          />
        )}
      />
    </ScreenShell>
  );
}

interface CardProps {
  item: CollectionRequest;
  variant: Aba;
  onPress: () => void;
}

function PedidoCard({ item, variant, onPress }: CardProps) {
  const m = materialOf(item.materialType);
  const q = quantityLabel(item.quantityEstimate);
  const dist =
    item.distanceKm !== undefined
      ? item.distanceKm < 1
        ? `${Math.round(item.distanceKm * 1000)} m`
        : `${item.distanceKm.toFixed(1)} km`
      : null;
  const expiresAt = item.reservedUntil ? new Date(item.reservedUntil).getTime() : null;
  const expiresInMin =
    expiresAt !== null ? Math.max(0, Math.round((expiresAt - Date.now()) / 60_000)) : null;

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
          {variant === 'proximos' ? (
            <>
              {dist && (
                <View style={styles.metaItem}>
                  <RIcon name="pin" size={12} color={PALETTE.inkSoft} />
                  <Text style={styles.metaText}>{dist}</Text>
                </View>
              )}
              {dist && <View style={styles.metaDot} />}
              <Text style={styles.metaText}>{relativeTime(item.createdAt)}</Text>
            </>
          ) : (
            <Text style={styles.metaText}>
              {expiresInMin !== null && expiresInMin > 0
                ? `expira em ${formatRemaining(expiresInMin)}`
                : 'expira em breve'}
            </Text>
          )}
        </View>
      </View>
      <Text style={[styles.tagLabel, variant === 'reservas' && { color: PALETTE.ink }]}>
        {variant === 'proximos' ? 'Aberta' : 'Reservada'}
      </Text>
    </Pressable>
  );
}

function formatRemaining(min: number): string {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

interface ToggleProps {
  view: 'lista' | 'mapa';
  onSwitchToMapa?: () => void;
  onSwitchToLista?: () => void;
}

export function ViewToggle({ view, onSwitchToMapa, onSwitchToLista }: ToggleProps) {
  const tabs: { id: 'lista' | 'mapa'; icon: IconName; onPress?: () => void }[] = [
    { id: 'lista', icon: 'list', onPress: onSwitchToLista },
    { id: 'mapa', icon: 'map', onPress: onSwitchToMapa },
  ];
  return (
    <View style={styles.toggleWrap}>
      {tabs.map((t) => {
        const on = view === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={t.onPress}
            style={[styles.toggleBtn, { backgroundColor: on ? PALETTE.paper : 'transparent' }]}
          >
            <RIcon name={t.icon} size={18} color={on ? PALETTE.ink : PALETTE.inkSoft} />
          </Pressable>
        );
      })}
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
    paddingBottom: 8,
  },
  hello: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: PALETTE.inkSoft,
    marginBottom: 4,
  },
  name: {
    fontFamily: FONTS.displayItalic,
    fontSize: 28,
    color: PALETTE.ink,
    letterSpacing: -0.4,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 4,
  },
  raiosScroll: {
    flexGrow: 0,
  },
  raios: {
    gap: 8,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 8,
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
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: PALETTE.inkSoft,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: PALETTE.rule,
  },
  tagLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: PALETTE.sageDeep,
  },
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: PALETTE.soft,
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
