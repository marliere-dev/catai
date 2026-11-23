import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { NATIVE_DRIVER } from '@/lib/native';
import { RIcon } from '@/icons/RIcon';
import { IconName } from '@/icons/paths';
import { PALETTE } from '@/theme/tokens';

interface Props {
  small?: boolean;
  pulse?: boolean;
  icon?: IconName;
  color?: string;
}

export function MapPin({
  small = false,
  pulse = false,
  icon = 'bag',
  color = PALETTE.sageDeep,
}: Props) {
  const size = small ? 28 : 40;
  const iconSize = small ? 14 : 20;

  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulse) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 900, useNativeDriver: NATIVE_DRIVER }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, pulseAnim]);

  const halo = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.7],
  });
  const haloOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <Animated.View style={[styles.wrap, { width: size, height: size }]}>
      {pulse && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.halo,
            {
              width: size,
              height: size,
              backgroundColor: color,
              transform: [{ scale: halo }],
              opacity: haloOpacity,
            },
          ]}
        />
      )}
      <Animated.View
        style={[
          styles.pin,
          { width: size, height: size, backgroundColor: color, borderColor: PALETTE.paper },
        ]}
      >
        <RIcon name={icon} size={iconSize} color={PALETTE.paper} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    borderRadius: 999,
  },
  pin: {
    borderRadius: 999,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PALETTE.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
});
