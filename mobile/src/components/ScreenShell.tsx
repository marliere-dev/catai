import { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PALETTE } from '@/theme/tokens';

interface Props {
  children: ReactNode;
  noTopPadding?: boolean;
}

export function ScreenShell({ children, noTopPadding = false }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.shell, !noTopPadding && { paddingTop: insets.top }]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: PALETTE.paper,
  },
});
