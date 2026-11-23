// Cataí — design tokens (sálvia palette, type, radii). Mirrors tokens.jsx of
// the Claude Design bundle — see /tmp/catai-app-final/catai-app/project/tokens.jsx.

export const PALETTE = {
  paper: '#FAF8F4',
  soft: '#EDE9DD',
  ink: '#2D3A2E',
  inkSoft: '#5C6B5E',
  sage: '#B8D4B5',
  sageDeep: '#6E8E6B',
  line: 'rgba(45,58,46,0.10)',
  rule: 'rgba(45,58,46,0.18)',
  terracota: '#B5704D',
  // status accents
  open: '#B8D4B5', // sálvia clara
  reserved: '#6E8E6B', // sálvia profunda
  done: '#2D3A2E', // ink
  off: '#A6A89A', // cinza esverdeado pra cancelada/expirada
} as const;

export type PaletteToken = keyof typeof PALETTE;

export const FONTS = {
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
  display: 'Fraunces_400Regular',
  displayItalic: 'Fraunces_400Regular_Italic',
  displayMediumItalic: 'Fraunces_500Medium_Italic',
} as const;

export const RADII = {
  card: 16,
  cardLg: 20,
  pill: 999,
  chip: 14,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 22,
  xl: 32,
} as const;
