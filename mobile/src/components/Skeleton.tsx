import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { NATIVE_DRIVER } from '@/lib/native';
import { PALETTE } from '@/theme/tokens';

interface Props {
  height?: number;
  radius?: number;
}

export function Skeleton({ height = 80, radius = 16 }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 1400, useNativeDriver: NATIVE_DRIVER }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={[styles.wrap, { height, borderRadius: radius }]}>
      <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: PALETTE.soft,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
    backgroundColor: PALETTE.paper,
    opacity: 0.6,
  },
});
