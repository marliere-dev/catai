import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { signIn } from '@/api/auth';
import { CataiApiError } from '@/api/client';
import { Button, ScreenShell, TextField, TopBar } from '@/components';
import { RIcon } from '@/icons/RIcon';
import { notify } from '@/lib/dialog';
import { FONTS, PALETTE } from '@/theme/tokens';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (!email.trim() || !senha) {
      notify('Campos incompletos', 'Informe e-mail e senha.');
      return;
    }
    setBusy(true);
    try {
      await signIn(email.trim(), senha);
      // root index.tsx redireciona conforme verificação + modo escolhido
      router.replace('/');
    } catch (err) {
      const message =
        err instanceof CataiApiError ? err.message : ((err as Error).message ?? 'Erro ao entrar');
      notify('Não foi possível entrar', message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenShell>
      <TopBar title="Entrar" onBack={() => router.back()} />
      <View style={styles.body}>
        <TextField
          label="E-mail"
          value={email}
          onChange={setEmail}
          placeholder="voce@exemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <TextField
          label="Senha"
          value={senha}
          onChange={setSenha}
          secureTextEntry={!show}
          placeholder="sua senha"
          autoComplete="password"
          trailing={
            <Pressable onPress={() => setShow((s) => !s)} style={styles.eye} hitSlop={8}>
              <RIcon name={show ? 'eyeOff' : 'eye'} size={18} color={PALETTE.inkSoft} />
            </Pressable>
          }
        />
        <Pressable style={styles.forgot} hitSlop={6}>
          <Text style={styles.forgotText}>esqueci a senha</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Button variant="primary" onPress={submit} disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </Button>
        <Pressable onPress={() => router.replace('/(auth)/cadastro')} style={styles.altLink}>
          <Text style={styles.altLinkText}>criar conta</Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  eye: {
    padding: 4,
  },
  forgot: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  forgotText: {
    color: PALETTE.inkSoft,
    fontSize: 13,
    fontFamily: FONTS.body,
  },
  altLink: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  altLinkText: {
    color: PALETTE.sageDeep,
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
  },
});
