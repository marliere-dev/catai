import { ReactNode } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

import { RIcon } from '@/icons/RIcon';
import { IconName } from '@/icons/paths';
import { FONTS, PALETTE } from '@/theme/tokens';

interface Props {
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Chip({ active = false, onPress, icon, children, size = 'md' }: Props) {
  const tall = size === 'lg' ? 56 : size === 'sm' ? 34 : 42;
  const px = size === 'lg' ? 20 : size === 'sm' ? 12 : 16;
  const fontSize = size === 'sm' ? 13 : 14;
  const iconSize = size === 'lg' ? 20 : 16;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.base,
        {
          height: tall,
          paddingHorizontal: px,
          borderColor: active ? PALETTE.ink : PALETTE.line,
          backgroundColor: active ? PALETTE.ink : 'transparent',
        },
      ]}
    >
      {icon && <RIcon name={icon} size={iconSize} color={active ? PALETTE.paper : PALETTE.ink} />}
      <Text style={[styles.label, { fontSize, color: active ? PALETTE.paper : PALETTE.ink }]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  label: {
    fontFamily: FONTS.bodyMedium,
  },
});
