import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, View, StyleSheet } from 'react-native';

import { RIcon } from '@/icons/RIcon';
import { IconName } from '@/icons/paths';
import { FONTS, PALETTE } from '@/theme/tokens';

interface Props {
  children: ReactNode;
  onConfirm: () => void;
  tone?: 'sage' | 'danger';
  duration?: number;
  icon?: IconName;
}

// Press-and-hold to confirm. Fill animates left → right while holding.
// Releasing before completion cancels.
export function HoldButton({ children, onConfirm, tone = 'sage', duration = 1100, icon }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const [done, setDone] = useState(false);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const fg = tone === 'danger' ? PALETTE.terracota : PALETTE.sageDeep;
  const idleBg = tone === 'danger' ? 'rgba(196,107,77,.08)' : 'rgba(110,142,107,.10)';
  const fillBg = tone === 'danger' ? PALETTE.terracota : PALETTE.sageDeep;
  const border = tone === 'danger' ? PALETTE.terracota : PALETTE.sageDeep;

  const start = () => {
    if (done) return;
    animationRef.current = Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animationRef.current.start(({ finished }) => {
      if (finished) {
        setDone(true);
        setTimeout(() => onConfirm(), 140);
      }
    });
  };

  const cancel = () => {
    if (done) return;
    animationRef.current?.stop();
    Animated.timing(progress, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => () => animationRef.current?.stop(), []);

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const labelColor = progress.interpolate({
    inputRange: [0, 0.55, 0.56, 1],
    outputRange: [fg, fg, PALETTE.paper, PALETTE.paper],
  });

  return (
    <Pressable
      onPressIn={start}
      onPressOut={cancel}
      style={[styles.base, { backgroundColor: idleBg, borderColor: border }]}
    >
      <Animated.View
        style={[styles.fill, { backgroundColor: fillBg, width: fillWidth }]}
        pointerEvents="none"
      />
      <View style={styles.labelRow}>
        {icon && <RIcon name={icon} size={20} color={fg} />}
        <Animated.Text style={[styles.label, { color: labelColor }]}>
          {done ? 'Pronto' : children}
        </Animated.Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 999,
    borderWidth: 1.5,
    overflow: 'hidden',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    opacity: 0.92,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 1,
  },
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    letterSpacing: -0.1,
  },
});
