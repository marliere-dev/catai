import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { useMode } from '@/hooks/useMode';
import { PALETTE } from '@/theme/tokens';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { mode, loading: modeLoading } = useMode();

  if (authLoading || modeLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: PALETTE.paper,
        }}
      >
        <ActivityIndicator color={PALETTE.sageDeep} />
      </View>
    );
  }

  if (!user) return <Redirect href="/splash" />;
  if (!user.emailVerified) return <Redirect href="/(auth)/verificar-email" />;
  if (!mode) return <Redirect href="/escolher-perfil" />;
  return <Redirect href={mode === 'dono' ? '/(dono)/home' : '/(catador)/pedidos'} />;
}
