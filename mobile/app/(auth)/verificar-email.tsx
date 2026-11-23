import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { reloadUser, resendVerification } from '@/api/auth';
import { Button, ScreenShell, TopBar } from '@/components';
import { RIcon } from '@/icons/RIcon';
import { notify } from '@/lib/dialog';
import { FONTS, PALETTE } from '@/theme/tokens';

export default function VerificarEmail() {
  const router = useRouter();
  const [busy, setBusy] = useState<'check' | 'resend' | null>(null);

  const check = async () => {
    if (busy) return;
    setBusy('check');
    try {
      const u = await reloadUser();
      if (u?.emailVerified) {
        router.replace('/escolher-perfil');
      } else {
        notify('Ainda não verificado', 'Confere o link no seu e-mail e tenta de novo.');
      }
    } catch (err) {
      notify('Erro', (err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const resend = async () => {
    if (busy) return;
    setBusy('resend');
    try {
      await resendVerification();
      notify('Reenviado', 'Olha de novo na sua caixa de e-mail.');
    } catch (err) {
      notify('Erro', (err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScreenShell>
      <TopBar onBack={() => router.back()} />
      <View style={styles.body}>
        <View style={styles.center}>
          <View style={styles.bubble}>
            <RIcon name="mail" size={48} color={PALETTE.ink} />
          </View>
          <Text style={styles.title}>confere seu e-mail</Text>
          <Text style={styles.subtitle}>
            enviamos um link pro seu e-mail. abre lá pra confirmar e volta pra cá.
          </Text>
        </View>
        <View style={styles.actions}>
          <Button variant="primary" onPress={check} disabled={busy !== null}>
            {busy === 'check' ? 'Verificando…' : 'Já verifiquei'}
          </Button>
          <View style={{ height: 12 }} />
          <Button variant="secondary" icon="refresh" onPress={resend} disabled={busy !== null}>
            {busy === 'resend' ? 'Reenviando…' : 'Reenviar email'}
          </Button>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    width: 112,
    height: 112,
    borderRadius: 999,
    backgroundColor: PALETTE.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontFamily: FONTS.displayItalic,
    fontSize: 28,
    color: PALETTE.ink,
    marginBottom: 14,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: PALETTE.inkSoft,
    maxWidth: 280,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
  },
});
