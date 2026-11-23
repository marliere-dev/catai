import { ReactNode } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';

import { RIcon } from '@/icons/RIcon';
import { FONTS, PALETTE } from '@/theme/tokens';

interface Props {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function TopBar({ title, onBack, right }: Props) {
  return (
    <View style={styles.bar}>
      {onBack !== undefined ? (
        <Pressable onPress={onBack} style={styles.back}>
          <RIcon name="chevronLeft" size={18} />
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {right ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    minHeight: 56,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: PALETTE.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  title: {
    flex: 1,
    fontFamily: FONTS.displayItalic,
    fontSize: 24,
    color: PALETTE.ink,
    letterSpacing: -0.3,
  },
});
