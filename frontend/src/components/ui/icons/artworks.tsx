import type { SvgProps } from 'react-native-svg';
import Svg, { Rect } from 'react-native-svg';

export function Artworks({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect
        x={3}
        y={3}
        width={7}
        height={7}
        rx={1.5}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x={14}
        y={3}
        width={7}
        height={7}
        rx={1.5}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x={3}
        y={14}
        width={7}
        height={7}
        rx={1.5}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x={14}
        y={14}
        width={7}
        height={7}
        rx={1.5}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
