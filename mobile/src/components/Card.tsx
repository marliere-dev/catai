import { ReactNode } from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';

import { PALETTE, RADII } from '@/theme/tokens';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  padding?: number;
  soft?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export function Card({ children, onPress, padding = 18, soft = false, style }: Props) {
  const containerStyle: ViewStyle = {
    backgroundColor: soft ? PALETTE.soft : PALETTE.paper,
    borderColor: PALETTE.line,
    borderWidth: 1,
    borderRadius: RADII.cardLg,
    padding,
  };

  if (!onPress) {
    return <View style={[containerStyle, style]}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [containerStyle, pressed && styles.pressed, style as ViewStyle]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    transform: [{ translateY: -1 }],
    shadowColor: PALETTE.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
});
