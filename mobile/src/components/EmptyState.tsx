import { ReactNode } from 'react';
import { Text, View, StyleSheet } from 'react-native';

import { RIcon } from '@/icons/RIcon';
import { IconName } from '@/icons/paths';
import { FONTS, PALETTE } from '@/theme/tokens';

interface Props {
  illo?: IconName;
  title: string;
  body: string;
  cta?: ReactNode;
}

export function EmptyState({ illo = 'sprout', title, body, cta }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.illo}>
        <RIcon name={illo} size={32} color={PALETTE.sageDeep} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {cta}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 32,
    paddingVertical: 48,
    alignItems: 'center',
  },
  illo: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: PALETTE.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: FONTS.displayItalic,
    fontSize: 22,
    color: PALETTE.ink,
    marginBottom: 6,
    textAlign: 'center',
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: PALETTE.inkSoft,
    lineHeight: 21,
    maxWidth: 240,
    textAlign: 'center',
    marginBottom: 18,
  },
});
