import { useRouter } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Button, ScreenShell } from '@/components';
import { FONTS, PALETTE } from '@/theme/tokens';

export default function Splash() {
  const router = useRouter();
  return (
    <ScreenShell>
      <View style={styles.wrap}>
        <View style={styles.top}>
          <Text style={styles.brand}>
            Cata
            <Text style={styles.brandItalic}>í</Text>
          </Text>
          <Text style={styles.tagline}>
            recicláveis sem desperdício,{'\n'}catadores sem rota perdida.
          </Text>
        </View>
        <View>
          <Button variant="primary" onPress={() => router.push('/(auth)/login')}>
            Entrar
          </Button>
          <View style={{ height: 12 }} />
          <Button variant="secondary" onPress={() => router.push('/(auth)/cadastro')}>
            Criar conta
          </Button>
          <Text style={styles.footer}>open source · sem fins lucrativos</Text>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 36,
    justifyContent: 'space-between',
  },
  top: {
    flex: 1,
    justifyContent: 'center',
  },
  brand: {
    fontFamily: FONTS.display,
    fontSize: 92,
    lineHeight: 92,
    color: PALETTE.ink,
    letterSpacing: -3,
  },
  brandItalic: {
    fontFamily: FONTS.displayItalic,
    color: PALETTE.sageDeep,
  },
  tagline: {
    marginTop: 22,
    fontFamily: FONTS.body,
    fontSize: 17,
    lineHeight: 24,
    color: PALETTE.inkSoft,
    maxWidth: 280,
  },
  footer: {
    marginTop: 24,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 11,
    textAlign: 'center',
    color: PALETTE.inkSoft,
    letterSpacing: 0.4,
  },
});
