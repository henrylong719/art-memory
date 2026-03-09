import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

export function Profile({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle
        cx={12}
        cy={8}
        r={4}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
