import { Pressable, Text, View, StyleSheet } from 'react-native';

import { RIcon } from '@/icons/RIcon';
import { IconName } from '@/icons/paths';
import { FONTS, PALETTE } from '@/theme/tokens';

type TabId = 'home' | 'pedidos' | 'perfil';

interface Tab {
  id: TabId;
  label: string;
  icon: IconName;
}

interface Props {
  active: TabId;
  onNav?: (tab: TabId) => void;
  profile?: 'dono' | 'catador';
}

const TABS_DONO: Tab[] = [
  { id: 'home', label: 'home', icon: 'home' },
  { id: 'perfil', label: 'perfil', icon: 'user' },
];

const TABS_CATADOR: Tab[] = [
  { id: 'pedidos', label: 'pedidos', icon: 'list' },
  { id: 'perfil', label: 'perfil', icon: 'user' },
];

export function BottomTabBar({ active, onNav, profile = 'dono' }: Props) {
  const tabs = profile === 'catador' ? TABS_CATADOR : TABS_DONO;
  return (
    <View style={styles.bar}>
      {tabs.map((t) => {
        const on = active === t.id;
        return (
          <Pressable key={t.id} onPress={() => onNav?.(t.id)} style={styles.tab}>
            <RIcon name={t.icon} size={24} color={on ? PALETTE.ink : PALETTE.inkSoft} />
            <Text
              style={[
                styles.label,
                {
                  color: on ? PALETTE.ink : PALETTE.inkSoft,
                  fontFamily: on ? FONTS.bodySemiBold : FONTS.bodyMedium,
                },
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    borderTopColor: PALETTE.line,
    backgroundColor: PALETTE.paper,
    paddingTop: 10,
    paddingBottom: 26,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tab: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  label: {
    fontSize: 11,
  },
});
