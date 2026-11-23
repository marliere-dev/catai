import Svg, { Path } from 'react-native-svg';

import { PALETTE } from '@/theme/tokens';

import { ICON_PATHS, IconName } from './paths';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
}

export function RIcon({ name, size = 24, color = PALETTE.ink }: Props) {
  const d = ICON_PATHS[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d={d} />
    </Svg>
  );
}
