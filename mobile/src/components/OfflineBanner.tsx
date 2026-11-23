import { Text, View, StyleSheet } from 'react-native';

import { RIcon } from '@/icons/RIcon';
import { FONTS, PALETTE } from '@/theme/tokens';

export function OfflineBanner() {
  return (
    <View style={styles.bar}>
      <RIcon name="wifiOff" size={14} color={PALETTE.inkSoft} />
      <Text style={styles.text}>sem conexão. mostrando o que já tinha aqui.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PALETTE.soft,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.line,
  },
  text: {
    fontFamily: FONTS.body,
    color: PALETTE.inkSoft,
    fontSize: 12,
  },
});
