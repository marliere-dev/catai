import { Slot, usePathname, useRouter } from 'expo-router';
import { View } from 'react-native';

import { BottomTabBar } from '@/components';
import { PALETTE } from '@/theme/tokens';

export default function DonoLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const active = pathname.endsWith('/perfil') ? 'perfil' : 'home';

  return (
    <View style={{ flex: 1, backgroundColor: PALETTE.paper }}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      <BottomTabBar
        active={active}
        profile="dono"
        onNav={(t) => {
          if (t === 'home') router.replace('/(dono)/home');
          else if (t === 'perfil') router.replace('/(dono)/perfil');
        }}
      />
    </View>
  );
}
