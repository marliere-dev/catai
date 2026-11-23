import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { signUp } from '@/api/auth';
import { Button, ScreenShell, TextField, TopBar } from '@/components';
import { RIcon } from '@/icons/RIcon';
import { CataiApiError } from '@/api/client';
import { notify } from '@/lib/dialog';
import { FONTS, PALETTE } from '@/theme/tokens';

export default function Cadastro() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (!nome.trim() || !email.trim() || senha.length < 8) {
      notify('Campos incompletos', 'Preencha nome, e-mail e uma senha de 8+ caracteres.');
      return;
    }
    setBusy(true);
    try {
      await signUp(nome.trim(), email.trim(), senha);
      router.replace('/(auth)/verificar-email');
    } catch (err) {
      const message =
        err instanceof CataiApiError
          ? err.message
          : ((err as Error).message ?? 'Erro ao criar conta');
      notify('Não foi possível criar a conta', message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenShell>
      <TopBar title="Criar conta" onBack={() => router.back()} />
      <View style={styles.body}>
        <TextField
          label="Nome"
          value={nome}
          onChange={setNome}
          placeholder="Maria Silva"
          autoCapitalize="words"
        />
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
          placeholder="mínimo 8 caracteres"
          trailing={
            <Pressable onPress={() => setShow((s) => !s)} style={styles.eye} hitSlop={8}>
              <RIcon name={show ? 'eyeOff' : 'eye'} size={18} color={PALETTE.inkSoft} />
            </Pressable>
          }
        />
        <Text style={styles.hint}>vamos enviar um e-mail pra confirmar. demora segundos.</Text>
        <View style={{ flex: 1 }} />
        <Button variant="primary" onPress={submit} disabled={busy}>
          {busy ? 'Criando…' : 'Criar conta'}
        </Button>
        <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.altLink}>
          <Text style={styles.altLinkText}>já tenho conta</Text>
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
  hint: {
    fontSize: 13,
    color: PALETTE.inkSoft,
    lineHeight: 20,
    marginTop: 4,
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
