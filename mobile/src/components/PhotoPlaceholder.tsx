import { Text, View, StyleSheet, Platform } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';

import { PALETTE } from '@/theme/tokens';

interface Props {
  label?: string;
  height?: number;
  radius?: number;
}

// Mirror the repeating-linear-gradient(135deg) hatching from the bundle's
// PhotoPlaceholder. SVG <pattern> on top of a soft fill works in RN.
export function PhotoPlaceholder({ label = 'foto', height = 200, radius = 16 }: Props) {
  return (
    <View style={[styles.wrap, { height, borderRadius: radius }]}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id="hatch"
            x="0"
            y="0"
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <Rect width="22" height="22" fill={PALETTE.soft} />
            <Path d="M0 0 H22" stroke={PALETTE.paper} strokeWidth="11" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#hatch)" />
      </Svg>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 12,
    color: PALETTE.inkSoft,
    letterSpacing: 0.5,
  },
});
