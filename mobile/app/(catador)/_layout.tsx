import { Slot, usePathname, useRouter } from 'expo-router';
import { View } from 'react-native';

import { BottomTabBar } from '@/components';
import { PALETTE } from '@/theme/tokens';

export default function CatadorLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const active = pathname.endsWith('/perfil') ? 'perfil' : 'pedidos';

  return (
    <View style={{ flex: 1, backgroundColor: PALETTE.paper }}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      <BottomTabBar
        active={active}
        profile="catador"
        onNav={(t) => {
          if (t === 'pedidos') router.replace('/(catador)/pedidos');
          else if (t === 'perfil') router.replace('/(catador)/perfil');
        }}
      />
    </View>
  );
}
