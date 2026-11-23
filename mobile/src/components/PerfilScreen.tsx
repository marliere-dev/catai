import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { logout } from '@/api/auth';
import { meApi } from '@/api/me';
import { useMode } from '@/hooks/useMode';
import { confirm } from '@/lib/dialog';
import { RIcon } from '@/icons/RIcon';
import { IconName } from '@/icons/paths';
import { FONTS, PALETTE } from '@/theme/tokens';
import { ScreenShell } from './ScreenShell';
import { Button } from './Button';
import { TopBar } from './TopBar';

const GITHUB_URL = 'https://github.com/Gabrielmarlier3/catai';

interface Props {
  profile: 'dono' | 'catador';
}

export function PerfilScreen({ profile }: Props) {
  const router = useRouter();
  const { clearMode } = useMode();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    let cancel = false;
    meApi
      .fetch()
      .then((me) => {
        if (cancel) return;
        setName(me.name);
        setEmail(me.email);
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, []);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const role = profile === 'catador' ? 'Catador' : 'Dono de reciclável';
  const modeLabel = profile === 'catador' ? 'Catador.' : 'Dono de reciclável.';

  const onSwitchMode = async () => {
    await clearMode();
    router.replace('/escolher-perfil');
  };

  const onLogout = async () => {
    const ok = await confirm({
      title: 'Sair',
      message: 'Quer mesmo encerrar a sessão?',
      confirmLabel: 'Sair',
      destructive: true,
    });
    if (!ok) return;
    await clearMode();
    await logout();
    router.replace('/splash');
  };

  const onGithub = () => Linking.openURL(GITHUB_URL).catch(() => undefined);

  const version = (Constants.expoConfig?.version as string | undefined) ?? '0.1.0';

  return (
    <ScreenShell>
      <TopBar onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.headerCenter}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || '·'}</Text>
          </View>
          <Text style={styles.name}>{name || '—'}</Text>
          <Text style={styles.email}>{email}</Text>
          <View style={styles.roleChip}>
            <Text style={styles.roleChipText}>{role}</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 22, paddingBottom: 8 }}>
          <ModeSwitchCard label={modeLabel} onSwitch={onSwitchMode} />
        </View>

        <View style={{ paddingHorizontal: 22, paddingTop: 14 }}>
          <PerfilRow icon="pencil" label="Editar nome" />
          <PerfilRow icon="shield" label="Termos e privacidade" />
          <PerfilRow icon="code" label="Github do projeto" external onPress={onGithub} />
        </View>

        <View style={{ paddingHorizontal: 22, paddingTop: 24, paddingBottom: 12 }}>
          <Button danger icon="logout" onPress={onLogout}>
            Sair da conta
          </Button>
        </View>

        <Text style={styles.versionText}>v{version} · open source</Text>
      </ScrollView>
    </ScreenShell>
  );
}

interface RowProps {
  icon: IconName;
  label: string;
  external?: boolean;
  onPress?: () => void;
}

function PerfilRow({ icon, label, external, onPress }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: PALETTE.soft }]}
    >
      <View style={styles.rowIcon}>
        <RIcon name={icon} size={18} color={PALETTE.ink} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <RIcon name={external ? 'arrowUpRight' : 'chevronRight'} size={14} color={PALETTE.inkSoft} />
    </Pressable>
  );
}

interface ModeSwitchProps {
  label: string;
  onSwitch: () => void;
}

function ModeSwitchCard({ label, onSwitch }: ModeSwitchProps) {
  return (
    <View style={styles.modeCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.modeHint}>Hoje você está usando como</Text>
        <Text style={styles.modeLabel}>{label}</Text>
      </View>
      <Pressable
        onPress={onSwitch}
        style={({ pressed }) => [styles.modeButton, pressed && { backgroundColor: PALETTE.soft }]}
      >
        <View style={styles.modeButtonIcon}>
          <RIcon name="refresh" size={12} color={PALETTE.ink} />
        </View>
        <Text style={styles.modeButtonText}>Trocar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCenter: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 22,
    alignItems: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: PALETTE.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontFamily: FONTS.displayItalic,
    fontSize: 36,
    color: PALETTE.ink,
  },
  name: {
    fontFamily: FONTS.displayItalic,
    fontSize: 26,
    color: PALETTE.ink,
    letterSpacing: -0.3,
  },
  email: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: PALETTE.inkSoft,
    marginTop: 4,
  },
  roleChip: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: PALETTE.soft,
  },
  roleChipText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: PALETTE.sageDeep,
    letterSpacing: 0.3,
  },
  modeCard: {
    backgroundColor: PALETTE.soft,
    borderRadius: 16,
    padding: 16,
    paddingLeft: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeHint: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: PALETTE.inkSoft,
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  modeLabel: {
    fontFamily: FONTS.displayMediumItalic,
    fontSize: 22,
    color: PALETTE.sageDeep,
    letterSpacing: -0.3,
    lineHeight: 25,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    paddingLeft: 10,
    borderRadius: 999,
    backgroundColor: PALETTE.paper,
    borderWidth: 1,
    borderColor: PALETTE.line,
  },
  modeButtonIcon: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: PALETTE.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: PALETTE.ink,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 4,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: PALETTE.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: PALETTE.ink,
  },
  versionText: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 32,
    textAlign: 'center',
    fontSize: 11,
    color: PALETTE.inkSoft,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    letterSpacing: 0.3,
  },
});
