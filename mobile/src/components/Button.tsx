import { ReactNode } from 'react';
import { Pressable, Text, ViewStyle, StyleSheet } from 'react-native';

import { RIcon } from '@/icons/RIcon';
import { IconName } from '@/icons/paths';
import { FONTS, PALETTE } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'sage';

interface Props {
  variant?: Variant;
  children: ReactNode;
  onPress?: () => void;
  icon?: IconName;
  full?: boolean;
  danger?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export function Button({
  variant = 'primary',
  children,
  onPress,
  icon,
  full = true,
  danger = false,
  disabled = false,
  style,
}: Props) {
  const look: ViewStyle = danger
    ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: PALETTE.terracota }
    : variant === 'primary'
      ? { backgroundColor: PALETTE.ink, ...shadow }
      : variant === 'secondary'
        ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: PALETTE.line }
        : { backgroundColor: PALETTE.sageDeep, ...shadowSage };

  const textColor = danger
    ? PALETTE.terracota
    : variant === 'primary' || variant === 'sage'
      ? PALETTE.paper
      : PALETTE.ink;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        look,
        full && { width: '100%' },
        pressed && !disabled && { transform: [{ scale: 0.97 }] },
        disabled && { opacity: 0.45 },
        style as ViewStyle,
      ]}
    >
      {icon && <RIcon name={icon} size={20} color={textColor} />}
      <Text style={[styles.label, { color: textColor }]}>{children}</Text>
    </Pressable>
  );
}

const shadow = {
  shadowColor: PALETTE.ink,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.18,
  shadowRadius: 6,
  elevation: 3,
};

const shadowSage = {
  shadowColor: PALETTE.sageDeep,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 6,
  elevation: 3,
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    letterSpacing: -0.1,
  },
});
