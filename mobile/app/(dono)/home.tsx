import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { meApi } from '@/api/me';
import { requestsApi } from '@/api/requests';
import { ScreenShell } from '@/components';
import { RIcon } from '@/icons/RIcon';
import { IconName } from '@/icons/paths';
import { FONTS, PALETTE } from '@/theme/tokens';

export default function HomeDono() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [openCount, setOpenCount] = useState<number | null>(null);
  const [lastDoneAt, setLastDoneAt] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancel = false;
      (async () => {
        try {
          const me = await meApi.fetch();
          if (!cancel) setFirstName(me.name.split(' ')[0] ?? '');
        } catch {
          // tolerante: app continua, só esconde o nome
        }
        try {
          const list = await requestsApi.listMy();
          if (cancel) return;
          setOpenCount(list.filter((r) => r.status === 'OPEN').length);
          const done = list
            .filter((r) => r.status === 'COMPLETED' && r.completedAt)
            .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))[0];
          setLastDoneAt(done?.completedAt ?? null);
        } catch {
          // sem rede / sem backend: mantem placeholders
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
      <View style={styles.greeting}>
        <Text style={styles.hello}>oi,</Text>
        <Text style={styles.name}>{firstName || '—'}</Text>
      </View>
      <View style={styles.body}>
        <BigActionCard
          icon="camera"
          title="Nova solicitação"
          body="tira uma foto, marca o local, pronto."
          accent
          onPress={() => router.push('/nova')}
        />
        <BigActionCard
          icon="list"
          title="Minhas solicitações"
          body="ver o que tá rolando."
          badge={openCount !== null ? `${openCount} abertas` : undefined}
          onPress={() => router.push('/minhas')}
        />
        <View style={{ flex: 1 }} />
        <Text style={styles.footer}>
          {lastDoneAt ? `última coleta · ${relative(lastDoneAt)}` : 'sem coletas ainda'}
        </Text>
      </View>
    </ScreenShell>
  );
}

function relative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const day = Math.floor(diff / 86_400_000);
  if (day < 1) return 'hoje';
  if (day === 1) return 'ontem';
  if (day < 7) return `há ${day} dias`;
  return `há ${Math.floor(day / 7)} semanas`;
}

interface CardProps {
  icon: IconName;
  title: string;
  body: string;
  badge?: string;
  accent?: boolean;
  onPress: () => void;
}

function BigActionCard({ icon, title, body, badge, accent, onPress }: CardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: accent ? PALETTE.ink : PALETTE.paper,
          borderWidth: accent ? 0 : 1,
          borderColor: PALETTE.line,
        },
        pressed && { transform: [{ translateY: -2 }] },
      ]}
    >
      <View
        style={[
          styles.cardIcon,
          {
            backgroundColor: accent ? PALETTE.sage : PALETTE.soft,
          },
        ]}
      >
        <RIcon name={icon} size={28} color={accent ? PALETTE.ink : PALETTE.sageDeep} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: accent ? PALETTE.paper : PALETTE.ink }]}>
          {title}
        </Text>
        <Text
          style={[
            styles.cardBody,
            { color: accent ? PALETTE.paper : PALETTE.inkSoft, opacity: accent ? 0.85 : 1 },
          ]}
        >
          {body}
        </Text>
      </View>
      {badge && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: accent ? 'rgba(255,255,255,0.15)' : PALETTE.sage,
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: accent ? PALETTE.paper : PALETTE.ink }]}>
            {badge}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  greeting: {
    paddingHorizontal: 24,
    paddingTop: 24,
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
    fontSize: 32,
    color: PALETTE.ink,
    letterSpacing: -0.4,
  },
  body: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 18,
    gap: 14,
  },
  card: {
    minHeight: 120,
    borderRadius: 22,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 19,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  cardBody: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
  },
  footer: {
    fontSize: 12,
    color: PALETTE.inkSoft,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    letterSpacing: 0.3,
  },
});
