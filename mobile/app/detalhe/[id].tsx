import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CataiApiError } from '@/api/client';
import { requestsApi } from '@/api/requests';
import { confirm, notify } from '@/lib/dialog';
import {
  Button,
  HoldButton,
  MapPreview,
  RequestPhoto,
  ScreenShell,
  StatusBadge,
  TopBar,
} from '@/components';
import { RIcon } from '@/icons/RIcon';
import { materialOf, quantityLabel, relativeTime, statusLabel } from '@/lib/labels';
import { FONTS, PALETTE } from '@/theme/tokens';
import type { CollectionRequest } from '@/types/api';

type Ctx = 'donoOpen' | 'donoReserved' | 'donoDone' | 'catadorOpen' | 'catadorReserved';

export default function Detalhe() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; ctx?: Ctx }>();
  const id = String(params.id);
  const initialCtx: Ctx = (params.ctx as Ctx) ?? 'donoOpen';
  const [ctx, setCtx] = useState<Ctx>(initialCtx);
  const [item, setItem] = useState<CollectionRequest | null>(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancel = false;
      requestsApi
        .findOne(id)
        .then((r) => {
          if (cancel) return;
          setItem(r);
          // Atualiza ctx automaticamente conforme o status atual do pedido
          if (initialCtx.startsWith('dono')) {
            if (r.status === 'OPEN') setCtx('donoOpen');
            else if (r.status === 'RESERVED') setCtx('donoReserved');
            else if (r.status === 'COMPLETED') setCtx('donoDone');
          } else {
            setCtx(r.status === 'RESERVED' ? 'catadorReserved' : 'catadorOpen');
          }
        })
        .catch((err) => {
          notify('Erro', (err as Error).message);
        });
      return () => {
        cancel = true;
      };
    }, [id, initialCtx]),
  );

  const back = () => {
    if (ctx.startsWith('catador')) router.replace('/(catador)/pedidos');
    else router.replace('/minhas');
  };

  const onAccept = async () => {
    if (!item) return;
    setBusy(true);
    try {
      const r = await requestsApi.reserve(item.id);
      setItem(r);
      setCtx('catadorReserved');
    } catch (err) {
      notify(
        'Não foi possível aceitar',
        err instanceof CataiApiError ? err.message : (err as Error).message,
      );
    } finally {
      setBusy(false);
    }
  };

  const onComplete = async () => {
    if (!item) return;
    try {
      await requestsApi.complete(item.id);
      back();
    } catch (err) {
      notify('Erro', err instanceof CataiApiError ? err.message : (err as Error).message);
    }
  };

  const onCancel = async () => {
    if (!item) return;
    const ok = await confirm({
      title: 'Cancelar solicitação?',
      message: 'Essa ação não pode ser desfeita.',
      confirmLabel: 'Cancelar',
      cancelLabel: 'Voltar',
      destructive: true,
    });
    if (!ok) return;
    try {
      await requestsApi.cancel(item.id);
      back();
    } catch (err) {
      notify('Erro', (err as Error).message);
    }
  };

  const openMaps = () => {
    if (!item) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${item.latitude},${item.longitude}`,
      android: `geo:0,0?q=${item.latitude},${item.longitude}`,
      default: `https://www.google.com/maps?q=${item.latitude},${item.longitude}`,
    });
    Linking.openURL(url).catch(() => undefined);
  };

  if (!item) {
    return (
      <ScreenShell>
        <TopBar onBack={back} />
        <View style={styles.loading}>
          <ActivityIndicator color={PALETTE.sageDeep} />
        </View>
      </ScreenShell>
    );
  }

  const m = materialOf(item.materialType);
  const q = quantityLabel(item.quantityEstimate);
  const statusLabelText = statusLabel(item.status);
  const badgeStatus =
    statusLabelText === 'expirada'
      ? 'cancelada'
      : (statusLabelText as 'aberta' | 'reservada' | 'concluida' | 'cancelada');

  return (
    <ScreenShell>
      <TopBar onBack={back} right={<StatusBadge status={badgeStatus} />} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }}>
        <View style={{ paddingHorizontal: 22 }}>
          <RequestPhoto
            uri={item.image?.imageUrl}
            label={`foto · ${m.label}`}
            height={220}
            radius={20}
          />
        </View>
        <View style={{ paddingHorizontal: 22, paddingTop: 20, paddingBottom: 8 }}>
          <Text style={styles.title}>
            {m.label}, {q}
          </Text>
          {item.notes ? <Text style={styles.notes}>{`"${item.notes}"`}</Text> : null}
          <Text style={styles.timestamp}>criada {relativeTime(item.createdAt)}</Text>
        </View>
        <View style={{ paddingHorizontal: 22, paddingTop: 4, paddingBottom: 8 }}>
          <Text style={styles.sectionLabel}>Localização</Text>
          <MapPreview
            latitude={item.latitude}
            longitude={item.longitude}
            height={140}
            radius={18}
            pulse={ctx === 'catadorReserved'}
          />
          {item.locationReference ? (
            <Text style={styles.locationRef}>{item.locationReference}</Text>
          ) : null}
        </View>

        {ctx === 'donoDone' && (
          <View style={styles.doneCard}>
            <RIcon name="checkCircle" size={28} color={PALETTE.sageDeep} />
            <View>
              <Text style={styles.doneTitle}>concluída</Text>
              {item.completedAt && (
                <Text style={styles.doneDate}>
                  {new Date(item.completedAt).toLocaleString('pt-BR')}
                </Text>
              )}
            </View>
          </View>
        )}
        <View style={{ height: 16 }} />
      </ScrollView>

      <View style={styles.footer}>
        {ctx === 'donoOpen' && (
          <Button danger onPress={onCancel}>
            Cancelar solicitação
          </Button>
        )}
        {ctx === 'donoReserved' && (
          <HoldButton tone="sage" onConfirm={onComplete}>
            Segurar pra concluir
          </HoldButton>
        )}
        {ctx === 'donoDone' && <Text style={styles.closedNote}>essa solicitação já fechou.</Text>}
        {ctx === 'catadorOpen' && (
          <Button variant="primary" onPress={onAccept} disabled={busy}>
            {busy ? 'Aceitando…' : 'Aceitar coleta'}
          </Button>
        )}
        {ctx === 'catadorReserved' && (
          <View style={{ gap: 10 }}>
            <Button variant="sage" icon="arrowUpRight" onPress={openMaps}>
              Abrir rota no maps
            </Button>
            <HoldButton tone="sage" onConfirm={onComplete}>
              Segurar pra concluir
            </HoldButton>
            <HoldButton tone="danger" onConfirm={onCancel}>
              Segurar pra cancelar reserva
            </HoldButton>
          </View>
        )}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.displayItalic,
    fontSize: 32,
    color: PALETTE.ink,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  notes: {
    fontFamily: FONTS.displayItalic,
    fontSize: 14,
    color: PALETTE.inkSoft,
    lineHeight: 22,
    marginBottom: 18,
  },
  timestamp: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 12,
    color: PALETTE.inkSoft,
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  sectionLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: PALETTE.ink,
    marginBottom: 10,
  },
  locationRef: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: PALETTE.inkSoft,
    marginTop: 8,
  },
  doneCard: {
    margin: 22,
    padding: 16,
    backgroundColor: PALETTE.soft,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doneTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: PALETTE.ink,
  },
  doneDate: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: PALETTE.inkSoft,
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: PALETTE.line,
    backgroundColor: PALETTE.paper,
  },
  closedNote: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: PALETTE.inkSoft,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
