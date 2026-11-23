import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components';
import { useMode, type AppMode } from '@/hooks/useMode';
import { RIcon } from '@/icons/RIcon';
import { IconName } from '@/icons/paths';
import { FONTS, PALETTE } from '@/theme/tokens';

export default function EscolherPerfil() {
  const router = useRouter();
  const { setMode } = useMode();

  const choose = async (m: AppMode) => {
    await setMode(m);
    router.replace(m === 'dono' ? '/(dono)/home' : '/(catador)/pedidos');
  };

  return (
    <ScreenShell>
      <View style={{ height: 24 }} />
      <View style={styles.header}>
        <Text style={styles.title}>
          como você vai usar{'\n'}o Cata
          <Text style={styles.titleAccent}>í</Text>?
        </Text>
        <Text style={styles.subtitle}>dá pra trocar quando quiser, lá no perfil.</Text>
      </View>
      <View style={styles.cards}>
        <ProfileCard
          icon="bag"
          title="Dono de reciclável"
          body="tenho material pra alguém coletar."
          onPress={() => choose('dono')}
        />
        <ProfileCard
          icon="cart"
          title="Catador"
          body="coleto material pra reciclagem."
          onPress={() => choose('catador')}
        />
      </View>
    </ScreenShell>
  );
}

interface CardProps {
  icon: IconName;
  title: string;
  body: string;
  onPress: () => void;
}

function ProfileCard({ icon, title, body, onPress }: CardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && {
          backgroundColor: PALETTE.soft,
          borderColor: PALETTE.sageDeep,
        },
      ]}
    >
      <View style={styles.iconWrap}>
        <RIcon name={icon} size={30} color={PALETTE.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardBody}>{body}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 26,
    paddingTop: 32,
  },
  title: {
    fontFamily: FONTS.displayItalic,
    fontSize: 32,
    color: PALETTE.ink,
    lineHeight: 37,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  titleAccent: {
    color: PALETTE.sageDeep,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: PALETTE.inkSoft,
    marginBottom: 28,
  },
  cards: {
    flex: 1,
    paddingHorizontal: 22,
    paddingBottom: 24,
    gap: 14,
  },
  card: {
    flex: 1,
    backgroundColor: PALETTE.paper,
    borderWidth: 1.5,
    borderColor: PALETTE.line,
    borderRadius: 22,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: PALETTE.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: FONTS.displayItalic,
    fontSize: 22,
    color: PALETTE.ink,
    marginBottom: 4,
  },
  cardBody: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: PALETTE.inkSoft,
    lineHeight: 19,
  },
});
