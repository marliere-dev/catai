import { View, StyleSheet } from 'react-native';
import Svg, { G, Line, Path, Rect } from 'react-native-svg';

import { PALETTE } from '@/theme/tokens';

import { MapPin } from './MapPin';

export interface MapPreviewProps {
  latitude?: number;
  longitude?: number;
  height?: number;
  pulse?: boolean;
  radius?: number;
}

// Versão web: MapLibre é nativo (codegenNativeComponent), então no browser
// caímos num placeholder em SVG que mantém o look-and-feel.
export function MapPreview({ height = 180, pulse = false, radius = 14 }: MapPreviewProps) {
  return (
    <View style={[styles.wrap, { height, borderRadius: radius }]}>
      <Svg width="100%" height="100%" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
        <Rect width={320} height={200} fill={PALETTE.soft} />
        <Rect x={20} y={120} width={80} height={60} rx={6} fill={PALETTE.sage} opacity={0.55} />
        <Rect x={220} y={20} width={80} height={60} rx={6} fill={PALETTE.sage} opacity={0.55} />
        <Path
          d="M0 60 Q80 80 160 50 T320 70"
          fill="none"
          stroke={PALETTE.sage}
          strokeWidth={14}
          opacity={0.5}
        />
        <G stroke={PALETTE.paper} strokeWidth={6} opacity={0.9}>
          <Line x1={0} y1={100} x2={320} y2={100} />
          <Line x1={160} y1={0} x2={160} y2={200} />
          <Line x1={0} y1={160} x2={320} y2={160} />
          <Line x1={80} y1={0} x2={80} y2={200} />
          <Line x1={240} y1={0} x2={240} y2={200} />
        </G>
        <G fill={PALETTE.paper} opacity={0.45}>
          <Rect x={100} y={110} width={50} height={40} />
          <Rect x={170} y={110} width={60} height={40} />
          <Rect x={170} y={170} width={60} height={30} />
        </G>
      </Svg>
      <View style={[styles.pinAbsolute, { left: '50%', top: '50%' }]} pointerEvents="none">
        <MapPin pulse={pulse} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.line,
    backgroundColor: PALETTE.soft,
    position: 'relative',
  },
  pinAbsolute: {
    position: 'absolute',
    transform: [{ translateX: -20 }, { translateY: -40 }],
  },
});
