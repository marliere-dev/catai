// Mapeia enums do backend para labels/ícones da UI definidos no design.
//
// Quando o backend evoluir os valores, basta alterar esse arquivo. Cada tela
// só consome essas funções e nunca conhece a string técnica do backend.

import type { IconName } from '@/icons/paths';
import type { MaterialType, QuantityEstimate, RequestStatus } from '@/types/api';

export interface MaterialLabel {
  label: string;
  icon: IconName;
}

const MATERIALS: Record<MaterialType, MaterialLabel> = {
  ALUMINUM: { label: 'alumínio', icon: 'alum' },
  CARDBOARD: { label: 'papelão', icon: 'paper' },
  PLASTIC: { label: 'plástico', icon: 'plastic' },
  GLASS: { label: 'vidro', icon: 'glass' },
  METAL: { label: 'metal', icon: 'metal' },
  COOKING_OIL: { label: 'óleo', icon: 'oil' },
  SMALL_ELECTRONICS: { label: 'eletrônico', icon: 'electronic' },
  MIXED: { label: 'misto', icon: 'mixed' },
};

const QUANTITIES: Record<QuantityEstimate, string> = {
  SMALL: 'pequena',
  MEDIUM: 'média',
  LARGE: 'grande',
};

const STATUSES: Record<RequestStatus, string> = {
  OPEN: 'aberta',
  RESERVED: 'reservada',
  COMPLETED: 'concluida',
  CANCELLED: 'cancelada',
  EXPIRED: 'expirada',
};

export function materialOf(t: MaterialType): MaterialLabel {
  return MATERIALS[t];
}

export function quantityLabel(q: QuantityEstimate): string {
  return QUANTITIES[q];
}

export function statusLabel(s: RequestStatus): string {
  return STATUSES[s];
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min}min`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `há ${hour}h`;
  const day = Math.floor(hour / 24);
  if (day === 1) return 'ontem';
  if (day < 7) return `há ${day} dias`;
  if (day < 14) return 'semana passada';
  return `há ${Math.floor(day / 7)} semanas`;
}

export const ALL_MATERIALS: { id: MaterialType; label: string; icon: IconName }[] = (
  Object.keys(MATERIALS) as MaterialType[]
).map((id) => ({ id, ...MATERIALS[id] }));

export const ALL_QUANTITIES: { id: QuantityEstimate; label: string }[] = (
  Object.keys(QUANTITIES) as QuantityEstimate[]
).map((id) => ({ id, label: QUANTITIES[id] }));
