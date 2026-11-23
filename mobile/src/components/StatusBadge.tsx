import { Text, View, StyleSheet } from 'react-native';

import { FONTS, PALETTE } from '@/theme/tokens';

export type RequestStatus = 'aberta' | 'reservada' | 'concluida' | 'cancelada' | 'expirada';

const MAP: Record<RequestStatus, { bg: string; fg: string; label: string }> = {
  aberta: { bg: PALETTE.sage, fg: PALETTE.ink, label: 'Aberta' },
  reservada: { bg: PALETTE.sageDeep, fg: PALETTE.paper, label: 'Reservada' },
  concluida: { bg: PALETTE.ink, fg: PALETTE.paper, label: 'Concluída' },
  cancelada: { bg: PALETTE.soft, fg: PALETTE.inkSoft, label: 'Cancelada' },
  expirada: { bg: PALETTE.soft, fg: PALETTE.inkSoft, label: 'Expirada' },
};

interface Props {
  status: RequestStatus;
}

export function StatusBadge({ status }: Props) {
  const s = MAP[status] ?? MAP.aberta;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.label, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    letterSpacing: 0.1,
  },
});
